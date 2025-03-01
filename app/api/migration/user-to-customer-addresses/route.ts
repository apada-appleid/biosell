import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CustomerAddress } from '@prisma/client';

// Types based on the schema
type UserWithAddresses = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  // Other user fields...
  addresses: Array<{
    id: string;
    fullName: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    isDefault: boolean;
  }>;
};

type CustomerWithAddresses = {
  id: string;
  email: string | null;
  fullName: string | null;
  mobile: string | null;
  // Other customer fields...
  addresses: CustomerAddress[];
};

// This is a one-time migration endpoint to move addresses from User to Customer model
// It should be secured and only accessible by admins or via a secure method
export async function POST(req: NextRequest) {
  console.log('Migration endpoint called');
  
  try {
    // Check for a basic auth token or other security measure
    const authHeader = req.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || authHeader !== `Bearer ${process.env.MIGRATION_SECRET_KEY}`) {
      console.log('Unauthorized attempt, expected:', process.env.MIGRATION_SECRET_KEY);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Auth successful, starting migration process');

    try {
      // First, check if the database connection works
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
        console.log('Database connection test successful');
      } catch (dbError: any) {
        console.error('Database connection test failed:', dbError);
        return NextResponse.json({
          error: 'Database connection failed',
          details: dbError.message
        }, { status: 500 });
      }
      
      // Check if addresses table exists
      let addressesTableExists = false;
      try {
        const tableCheck = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'addresses'
          ) as exists;
        `;
        // @ts-ignore - Check the result based on the database response format
        addressesTableExists = tableCheck[0]?.exists || false;
        console.log('Addresses table exists:', addressesTableExists);
        
        if (!addressesTableExists) {
          console.log('Addresses table not found - this likely means the migration has already been completed');
          
          // Return a success message indicating no migration was needed
          return NextResponse.json({
            success: true,
            message: 'Migration not needed - addresses table does not exist',
            summary: {
              usersProcessed: 0,
              customersCreated: 0,
              addressesMigrated: 0,
              errors: []
            }
          });
        }
      } catch (tableError: any) {
        console.error('Table check failed:', tableError);
        return NextResponse.json({
          error: 'Table check failed',
          details: tableError.message
        }, { status: 500 });
      }

      // Get all users with addresses using raw query
      console.log('Executing raw SQL query...');
      
      const usersWithAddressesRaw = await prisma.$queryRaw<Array<any>>`
        SELECT 
          u.id, 
          u.email, 
          u.name, 
          u.phone, 
          a.id as address_id, 
          a.full_name, 
          a.phone as address_phone, 
          a.address, 
          a.city, 
          a.province, 
          a.postal_code, 
          a.is_default
        FROM 
          users u
        LEFT JOIN 
          addresses a ON a.user_id = u.id
        ORDER BY 
          u.id, a.id
      `;
      
      console.log(`Query returned ${usersWithAddressesRaw.length} rows`);
      
      // Process the raw data to reconstruct user objects with their addresses
      const usersMap = new Map<string, UserWithAddresses>();
      
      for (const row of usersWithAddressesRaw) {
        if (!row.id) {
          console.log('Skipping row with missing user ID');
          continue;
        }
        
        // If we haven't seen this user before, add them to the map
        if (!usersMap.has(row.id)) {
          usersMap.set(row.id, {
            id: row.id,
            email: row.email || null,
            name: row.name || null,
            phone: row.phone || null,
            addresses: []
          });
        }
        
        // If this row has address data, add it to the user's addresses array
        if (row.address_id) {
          const user = usersMap.get(row.id);
          if (user) {
            user.addresses.push({
              id: row.address_id,
              fullName: row.full_name || null,
              phone: row.address_phone || null,
              address: row.address || null,
              city: row.city || null,
              province: row.province || null,
              postalCode: row.postal_code || null,
              isDefault: Boolean(row.is_default)
            });
          }
        }
      }
      
      const usersWithAddresses = Array.from(usersMap.values());
      console.log(`Processed ${usersWithAddresses.length} users with addresses`);

      // Initialize counters for the migration report
      let usersProcessed = 0;
      let customersCreated = 0;
      let addressesMigrated = 0;
      let errors: Array<{ userId: string; error: string }> = [];

      // For each user
      for (const user of usersWithAddresses) {
        usersProcessed++;
        
        if (!user.addresses || user.addresses.length === 0) {
          console.log(`User ${user.id} has no addresses, skipping`);
          continue; // Skip users without addresses
        }

        try {
          console.log(`Processing user ${user.id} with email ${user.email || 'no email'}`);
          
          // Check if a customer with the same email exists
          let customer = user.email 
            ? await prisma.customer.findUnique({
                where: { email: user.email },
                include: { addresses: true }
              }) as CustomerWithAddresses | null
            : null;

          if (customer) {
            console.log(`Found existing customer for email ${user.email}`);
          } else if (user.email) {
            console.log(`Creating new customer for user ${user.id}`);
            customer = await prisma.customer.create({
              data: {
                email: user.email,
                fullName: user.name || undefined,
                mobile: user.phone || undefined
              },
              include: { addresses: true }
            }) as CustomerWithAddresses;
            customersCreated++;
            console.log(`Created customer with ID ${customer.id}`);
          }

          if (customer) {
            // For each of the user's addresses
            for (const address of user.addresses) {
              console.log(`Processing address ${address.id}`);
              
              // Check if the customer already has a similar address
              const existingAddress = customer.addresses.find(
                addr => 
                  addr.address === address.address && 
                  addr.city === address.city && 
                  addr.postalCode === address.postalCode
              );

              if (!existingAddress) {
                console.log(`Creating new address for customer ${customer.id}`);
                
                // Prepare the address data, handling null values
                // All fields are required according to the schema
                const addressData = {
                  fullName: address.fullName || customer.fullName || 'Unknown',
                  phone: address.phone || customer.mobile || '0000000000',
                  address: address.address || '',
                  city: address.city || '',
                  province: address.province || '',
                  postalCode: address.postalCode || '',
                  isDefault: address.isDefault,
                  customerId: customer.id
                };
                
                // Create a new address for the customer
                await prisma.customerAddress.create({
                  data: addressData
                });
                
                addressesMigrated++;
                console.log(`Address created successfully`);
              } else {
                console.log(`Address already exists, skipping`);
              }
            }
          } else {
            console.log(`No customer found or created for user ${user.id}, skipping addresses`);
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Unknown error';
          console.error(`Error processing user ${user.id}:`, errorMessage);
          errors.push({ userId: user.id, error: errorMessage });
        }
      }

      // Return a summary of the migration
      console.log(`Migration complete. Processed ${usersProcessed} users, created ${customersCreated} customers, migrated ${addressesMigrated} addresses`);
      return NextResponse.json({
        success: true,
        summary: {
          usersProcessed,
          customersCreated,
          addressesMigrated,
          errors: errors.length > 0 ? errors : []
        }
      });
    } catch (queryError: any) {
      const errorMessage = queryError.message || 'Unknown query error';
      console.error('Error executing query:', errorMessage);
      return NextResponse.json({ 
        error: 'Error executing query', 
        details: errorMessage
      }, { status: 500 });
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    console.error('Migration error:', errorMessage);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: errorMessage
    }, { status: 500 });
  }
} 
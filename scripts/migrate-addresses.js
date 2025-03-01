// Script to migrate addresses from User to Customer
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateAddresses() {
  console.log('Starting address migration process...');
  
  // Initialize counters for the migration report
  let usersProcessed = 0;
  let customersCreated = 0;
  let addressesMigrated = 0;
  let errors = [];

  try {
    // Get all users with old addresses
    // Note: This assumes the addresses table still exists at this point
    // If you've already removed it from the schema, you'll need to handle this differently
    console.log('Fetching users with addresses...');
    
    // For demo purposes, we're simulating getting users with addresses
    // In a real migration, you would query the old database structure
    const usersWithAddresses = [
      /* Example data structure - to be replaced with actual query:
      {
        id: '1',
        email: 'user1@example.com',
        name: 'User One',
        phone: '1234567890',
        addresses: [
          {
            id: 'addr1',
            fullName: 'User One',
            phone: '1234567890',
            address: '123 Main St',
            city: 'Example City',
            province: 'Example Province',
            postalCode: '12345',
            isDefault: true,
          }
        ]
      }
      */
    ];
    
    // If migrating from a database where addresses table still exists:
    // const usersWithAddresses = await prisma.$transaction(async (tx) => {
    //   const users = await tx.user.findMany();
    //   const results = [];
    //   
    //   for (const user of users) {
    //     const addresses = await tx.$queryRaw`SELECT * FROM addresses WHERE user_id = ${user.id}`;
    //     results.push({
    //       ...user,
    //       addresses: addresses || []
    //     });
    //   }
    //   
    //   return results;
    // });

    console.log(`Found ${usersWithAddresses.length} users with addresses to migrate.`);

    // For each user
    for (const user of usersWithAddresses) {
      usersProcessed++;
      
      if (!user.addresses || user.addresses.length === 0) {
        continue; // Skip users without addresses
      }

      try {
        // Check if a customer with the same email exists
        let customer = null;
        if (user.email) {
          customer = await prisma.customer.findUnique({
            where: { email: user.email },
            include: { addresses: true }
          });
        }

        // If no customer exists, create one
        if (!customer && user.email) {
          customer = await prisma.customer.create({
            data: {
              email: user.email,
              fullName: user.name,
              mobile: user.phone
            },
            include: { addresses: true }
          });
          customersCreated++;
          console.log(`Created new customer for user: ${user.email}`);
        }

        if (customer) {
          // For each of the user's addresses
          for (const address of user.addresses) {
            // Check if the customer already has a similar address
            const existingAddress = customer.addresses.find(
              addr => addr.address === address.address && 
                    addr.city === address.city && 
                    addr.postalCode === address.postalCode
            );

            if (!existingAddress) {
              // Create a new address for the customer
              await prisma.customerAddress.create({
                data: {
                  fullName: address.fullName,
                  phone: address.phone,
                  address: address.address,
                  city: address.city,
                  province: address.province,
                  postalCode: address.postalCode,
                  isDefault: address.isDefault,
                  customerId: customer.id
                }
              });
              addressesMigrated++;
              console.log(`Migrated address for customer: ${customer.email || customer.id}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        errors.push({ userId: user.id, error: error.message });
      }
    }

    // Return a summary of the migration
    console.log('\nMigration Summary:');
    console.log(`- Users processed: ${usersProcessed}`);
    console.log(`- Customers created: ${customersCreated}`);
    console.log(`- Addresses migrated: ${addressesMigrated}`);
    
    if (errors.length > 0) {
      console.log(`- Errors: ${errors.length}`);
      console.log(errors);
    } else {
      console.log('- No errors encountered');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateAddresses()
  .then(() => console.log('Migration process completed.'))
  .catch(error => console.error('Migration process failed:', error)); 
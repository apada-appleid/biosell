import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import jwt from 'jsonwebtoken';

// GET: Fetch customer addresses from CustomerAddress model
export async function GET(req: NextRequest) {
  try {
    // Try to get session from NextAuth
    const session = await getServerSession(authOptions);
    let customerId = null;
    
    console.log('session', session);
    
    // Check if we have a valid session with user email
    if (session?.user?.email) {
      // Try to find customer with matching email
      const customer = await prisma.customer.findUnique({
        where: { email: session.user.email }
      });
      
      if (customer) {
        customerId = customer.id;
      }
    } 
    
    // If no session or no customer found from session, try token from Authorization header
    if (!customerId) {
      // Get authorization header
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token
        const token = authHeader.substring(7);
        console.log('Received auth token in header:', token ? 'Token exists' : 'No token');
        
        try {
          // Direct validation of token payload
          const secret = process.env.SECRET_KEY || "default-secret-key";
          
          try {
            // Try standard JWT validation
            const decoded = jwt.verify(token, secret) as any;
            console.log('Decoded token using JWT verification:', decoded);
            
            if (decoded && (decoded.userId || decoded.id)) {
              // Set customerId from token
              customerId = decoded.userId || decoded.id;
              console.log('Found customerId in token:', customerId);
            }
          } catch (jwtError) {
            console.error('JWT verification failed:', jwtError);
            
            // Try to parse as JSON if JWT validation fails
            try {
              // Some clients might store tokens with extra quotes or as JSON objects
              // Try to clean and parse
              const cleanToken = token.replace(/^["'](.*)["']$/, '$1');
              
              if (cleanToken !== token) {
                // If we cleaned something, try again with the cleaned token
                try {
                  const decodedClean = jwt.verify(cleanToken, secret) as any;
                  console.log('Decoded cleaned token:', decodedClean);
                  
                  if (decodedClean && (decodedClean.userId || decodedClean.id)) {
                    // Set customerId from token
                    customerId = decodedClean.userId || decodedClean.id;
                    console.log('Found customerId in cleaned token:', customerId);
                  }
                } catch (cleanTokenError) {
                  console.error('Clean token verification failed:', cleanTokenError);
                }
              }
              
              // Last resort: try to simply JSON parse the token
              // (in case it's a stored JSON object rather than a JWT)
              if (!customerId) {
                try {
                  const parsedToken = JSON.parse(token);
                  console.log('Parsed token as JSON:', parsedToken);
                  
                  if (parsedToken && (parsedToken.userId || parsedToken.id)) {
                    customerId = parsedToken.userId || parsedToken.id;
                    console.log('Found customerId in parsed JSON token:', customerId);
                  }
                } catch (parseError) {
                  console.error('JSON parse failed:', parseError);
                }
              }
            } catch (alternateError) {
              console.error('All alternate token parsing methods failed:', alternateError);
            }
          }
        } catch (tokenError) {
          console.error('Token verification completely failed:', tokenError);
        }
      } else {
        console.log('No auth header found or header not in Bearer format');
      }
    }

    console.log('customerId', customerId);
    
    // If no valid authentication found
    if (!customerId) {
      console.log('No valid customer authentication found');
      return NextResponse.json({ 
        error: 'Unauthorized - Customer not found',
        details: 'Please log in with a valid customer account' 
      }, { status: 401 });
    }
    
    // Fetch customer with addresses
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { addresses: true }
    });
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Handle migration case - if we have address in Customer model but no addresses in CustomerAddress yet
    if (customer.addresses.length === 0 && customer.address) {
      // Create a temporary address object from the old fields
      const legacyAddress = {
        id: 'legacy', // This will be replaced by a real ID if actually saved
        customerId: customer.id,
        fullName: customer.fullName || '',
        phone: customer.mobile || '', // Use mobile as phone
        address: customer.address || '',
        city: customer.city || '',
        province: '', // No province in old model
        postalCode: customer.postalCode || '',
        isDefault: true // Only one address, so it's the default
      };
      
      return NextResponse.json({ 
        addresses: [legacyAddress],
        _legacyMode: true // Flag to indicate this is from legacy data
      });
    }
    
    // Return the addresses
    return NextResponse.json({ 
      addresses: customer.addresses 
    });
  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST: Create a new customer address
export async function POST(req: NextRequest) {
  try {
    // Try to get session from NextAuth
    const session = await getServerSession(authOptions);
    let customerId = null;
    
    // Check if we have a valid session
    if (session?.user?.email) {
      // Find customer by email
      const customer = await prisma.customer.findUnique({
        where: { email: session.user.email }
      });
      
      if (customer) {
        customerId = customer.id;
      }
    } 
    
    // If no session or no customer found from session, try token from Authorization header
    if (!customerId) {
      // Get authorization header
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token
        const token = authHeader.substring(7);
        console.log('Received auth token in header for POST:', token ? 'Token exists' : 'No token');
        
        try {
          // Verify the token
          const decodedToken = await verifyAuthToken(token);
          console.log('Decoded token for POST:', decodedToken);
          
          if (decodedToken && decodedToken.userId) {
            // Set customerId from token
            customerId = decodedToken.userId;
          }
        } catch (tokenError) {
          console.error('Token verification failed for POST:', tokenError);
        }
      } else {
        console.log('No auth header found for POST');
      }
    }
    
    // If no valid authentication found
    if (!customerId) {
      console.log('No valid customer authentication found for POST');
      return NextResponse.json({ error: 'Unauthorized - لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['fullName', 'address', 'city', 'postalCode', 'phone'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `${field} is required - فیلد ${field} الزامی است` }, { status: 400 });
      }
    }
    
    // If this is the first address or isDefault is true, set all other addresses to non-default
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false }
      });
    }
    
    // Check if this is the first address - make it default in that case
    const addressCount = await prisma.customerAddress.count({
      where: { customerId }
    });
    
    if (addressCount === 0) {
      data.isDefault = true;
    }
    
    // Create the new address
    try {
      const address = await prisma.customerAddress.create({
        data: {
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          province: data.province || '',
          postalCode: data.postalCode,
          isDefault: data.isDefault || false,
          customerId
        }
      });
      
      console.log('Address created successfully:', address.id);
      return NextResponse.json({ address }, { status: 201 });
    } catch (dbError) {
      console.error('Database error creating address:', dbError);
      return NextResponse.json({ error: 'Failed to create address in database' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address - خطا در ذخیره آدرس' }, { status: 500 });
  }
}

// PATCH: Update a specific address
export async function PATCH(req: NextRequest) {
  try {
    // Try to get session from NextAuth
    const session = await getServerSession(authOptions);
    let customerId = null;
    
    // Check if we have a valid session
    if (session?.user?.email) {
      // Find customer by email
      const customer = await prisma.customer.findUnique({
        where: { email: session.user.email }
      });
      
      if (customer) {
        customerId = customer.id;
      }
    } 
    
    // If no session or no customer found from session, try token from Authorization header
    if (!customerId) {
      // Get authorization header
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token
        const token = authHeader.substring(7);
        console.log('Received auth token in header for PATCH:', token ? 'Token exists' : 'No token');
        
        try {
          // Verify the token
          const decodedToken = await verifyAuthToken(token);
          console.log('Decoded token for PATCH:', decodedToken);
          
          if (decodedToken && decodedToken.userId) {
            // Set customerId from token
            customerId = decodedToken.userId;
          }
        } catch (tokenError) {
          console.error('Token verification failed for PATCH:', tokenError);
        }
      } else {
        console.log('No auth header found for PATCH');
      }
    }
    
    // If no valid authentication found
    if (!customerId) {
      console.log('No valid customer authentication found for PATCH');
      return NextResponse.json({ error: 'Unauthorized - لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Check for address ID from query params or request body
    const url = new URL(req.url);
    const idFromQuery = url.searchParams.get('id');
    const id = idFromQuery || data.id;
    
    // Check if the default flag was passed in query params
    const defaultFromQuery = url.searchParams.get('default');
    const isSettingDefault = defaultFromQuery === 'true' || data.isDefault;
    
    if (!id) {
      return NextResponse.json({ error: 'Address ID is required - شناسه آدرس الزامی است' }, { status: 400 });
    }
    
    // Handle legacy address mode - if the ID is 'legacy', create a new address
    if (id === 'legacy') {
      // Validate required fields
      const requiredFields = ['fullName', 'address', 'city', 'postalCode', 'phone'];
      for (const field of requiredFields) {
        if (!data[field]) {
          return NextResponse.json({ error: `${field} is required - فیلد ${field} الزامی است` }, { status: 400 });
        }
      }
      
      try {
        // Create a new address from legacy data
        const address = await prisma.customerAddress.create({
          data: {
            fullName: data.fullName,
            phone: data.phone,
            address: data.address,
            city: data.city,
            province: data.province || '',
            postalCode: data.postalCode,
            isDefault: true, // Make it default since it's the only address
            customerId
          }
        });
        
        // Clear the legacy fields from the customer
        await prisma.customer.update({
          where: { id: customerId },
          data: {
            address: null,
            city: null,
            postalCode: null
          }
        });
        
        console.log('Migrated legacy address successfully:', address.id);
        return NextResponse.json({ address });
      } catch (dbError) {
        console.error('Database error migrating legacy address:', dbError);
        return NextResponse.json({ error: 'Failed to migrate legacy address' }, { status: 500 });
      }
    }
    
    // Verify that the address belongs to the current customer
    const address = await prisma.customerAddress.findUnique({
      where: { id }
    });
    
    if (!address) {
      return NextResponse.json({ error: 'Address not found - آدرس مورد نظر یافت نشد' }, { status: 404 });
    }
    
    if (address.customerId !== customerId) {
      console.log('Customer trying to update address that does not belong to them');
      return NextResponse.json({ error: 'Unauthorized - شما مجاز به ویرایش این آدرس نیستید' }, { status: 401 });
    }
    
    // If setting as default, update all other addresses to be non-default
    if (isSettingDefault) {
      await prisma.customerAddress.updateMany({
        where: { 
          customerId,
          id: { not: id }
        },
        data: { isDefault: false }
      });
      
      // If only setting default and no other data is provided, just update isDefault
      if (Object.keys(data).length <= 1 && (data.isDefault || !data.id)) {
        const updatedAddress = await prisma.customerAddress.update({
          where: { id },
          data: { isDefault: true }
        });
        
        console.log('Address set as default successfully:', updatedAddress.id);
        return NextResponse.json({ address: updatedAddress });
      }
    }
    
    // Prepare update data excluding the ID
    const { id: addressId, ...updateData } = data;
    
    // Update the address
    try {
      const updatedAddress = await prisma.customerAddress.update({
        where: { id },
        data: {
          ...updateData,
          isDefault: isSettingDefault ? true : updateData.isDefault
        }
      });
      
      console.log('Address updated successfully:', updatedAddress.id);
      return NextResponse.json({ address: updatedAddress });
    } catch (dbError) {
      console.error('Database error updating address:', dbError);
      return NextResponse.json({ error: 'Failed to update address in database' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Failed to update address - خطا در بروزرسانی آدرس' }, { status: 500 });
  }
}

// DELETE: Remove an address
export async function DELETE(req: NextRequest) {
  try {
    // Try to get session from NextAuth
    const session = await getServerSession(authOptions);
    let customerId = null;
    
    // Check if we have a valid session
    if (session?.user?.email) {
      // Find customer by email
      const customer = await prisma.customer.findUnique({
        where: { email: session.user.email }
      });
      
      if (customer) {
        customerId = customer.id;
      }
    } 
    
    // If no session or no customer found from session, try token from Authorization header
    if (!customerId) {
      // Get authorization header
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token
        const token = authHeader.substring(7);
        console.log('Received auth token in header for DELETE:', token ? 'Token exists' : 'No token');
        
        try {
          // Verify the token
          const decodedToken = await verifyAuthToken(token);
          console.log('Decoded token for DELETE:', decodedToken);
          
          if (decodedToken && decodedToken.userId) {
            // Set customerId from token
            customerId = decodedToken.userId;
          }
        } catch (tokenError) {
          console.error('Token verification failed for DELETE:', tokenError);
        }
      } else {
        console.log('No auth header found for DELETE');
      }
    }
    
    // If no valid authentication found
    if (!customerId) {
      console.log('No valid customer authentication found for DELETE');
      return NextResponse.json({ error: 'Unauthorized - لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Address ID is required - شناسه آدرس الزامی است' }, { status: 400 });
    }
    
    // Handle "legacy" ID - clear fields from customer record
    if (id === 'legacy') {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          address: null,
          city: null,
          postalCode: null
        }
      });
      
      return NextResponse.json({ success: true });
    }
    
    // Verify that the address belongs to the current customer
    const address = await prisma.customerAddress.findUnique({
      where: { id }
    });
    
    if (!address) {
      return NextResponse.json({ error: 'Address not found - آدرس مورد نظر یافت نشد' }, { status: 404 });
    }
    
    if (address.customerId !== customerId) {
      return NextResponse.json({ error: 'Unauthorized - شما مجاز به حذف این آدرس نیستید' }, { status: 401 });
    }
    
    // Delete the address
    await prisma.customerAddress.delete({
      where: { id }
    });
    
    // If this was the default address, set another one as default if exists
    if (address.isDefault) {
      const anotherAddress = await prisma.customerAddress.findFirst({
        where: { customerId }
      });
      
      if (anotherAddress) {
        await prisma.customerAddress.update({
          where: { id: anotherAddress.id },
          data: { isDefault: true }
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address - خطا در حذف آدرس' }, { status: 500 });
  }
} 
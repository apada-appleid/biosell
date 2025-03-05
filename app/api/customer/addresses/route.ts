import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import jwt from 'jsonwebtoken';
import { getAuthenticatedUser, isCustomer } from '@/lib/auth-helpers';

// GET: Fetch customer addresses from CustomerAddress model
export async function GET(req: NextRequest) {
  try {
    // Try to get session from NextAuth first
    const session = await getServerSession(authOptions);
    let customerId = null;
    
    // Check if we have a valid session with customer type
    if (session?.user?.id && session.user.type === 'customer') {
      customerId = session.user.id;
    } 
    // For sessions with non-customer type, block access
    else if (session?.user?.type && session.user.type !== 'customer') {
      return NextResponse.json(
        { error: 'Access denied: Only customers can access addresses' },
        { status: 403 }
      );
    }
    // If no valid session found, try token authentication
    else {
      const user = await getAuthenticatedUser(req);
      
      // Block non-customer users
      if (user && user.type !== 'customer') {
        return NextResponse.json(
          { error: 'Access denied: Only customers can access addresses' },
          { status: 403 }
        );
      }
      
      // Set customerId if we have a valid customer
      if (user && user.type === 'customer') {
        customerId = user.userId;
      }
    }
    
    // If we still don't have a customer ID, return unauthorized
    if (!customerId) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid customer authentication required' },
        { status: 401 }
      );
    }
    
    // Now fetch addresses for the authenticated customer
    const addresses = await prisma.customerAddress.findMany({
      where: {
        customerId: customerId,
      },
      orderBy: {
        isDefault: 'desc',
      },
    });
    
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
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
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { verifyAuthToken } from '@/lib/jwt';

// GET: Fetch all addresses for the authenticated customer
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
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    // If no valid session found, try token authentication
    else {
      const user = await getAuthenticatedUser(req);
      
      // Block non-customer users
      if (user && user.type !== 'customer') {
        return NextResponse.json(
          { error: 'Access denied: Only customers can access addresses' },
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          }
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
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Now fetch addresses for the authenticated customer (excluding soft deleted ones)
    const addresses = await prisma.customerAddress.findMany({
      where: {
        customerId: customerId,
        deletedAt: null
      },
      orderBy: {
        isDefault: 'desc',
      },
    });
    
    return NextResponse.json({ addresses }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// POST: Create a new customer address
export async function POST(req: NextRequest) {
  try {
    // Try to get session from NextAuth
    const session = await getServerSession(authOptions);
    let customerId = null;
    
    // Check if we have a valid session with userId
    if (session?.user?.id && session?.user?.type === 'customer') {
      customerId = session.user.id;
    } 
    // If no session, try JWT token
    else {
      // Try to get authenticated user from Bearer token
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token
        const token = authHeader.substring(7);
        
        try {
          // Verify the token
          const decodedToken = await verifyAuthToken(token);
          
          if (decodedToken && decodedToken.userId && decodedToken.type === 'customer') {
            // Set customerId from token
            customerId = decodedToken.userId;
          }
        } catch (tokenError) {
          console.error('Token verification failed for POST:', tokenError);
        }
      }
    }
    
    // If no valid authentication found
    if (!customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['fullName', 'address', 'city', 'postalCode', 'mobile'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `${field} is required` }, { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // If this is the first address or isDefault is true, set all other addresses to non-default
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { 
          customerId,
          deletedAt: null
        },
        data: { isDefault: false }
      });
    }
    
    // Check if this is the first address - make it default in that case
    const addressCount = await prisma.customerAddress.count({
      where: { 
        customerId,
        deletedAt: null
      }
    });
    
    if (addressCount === 0) {
      data.isDefault = true;
    }
    
    // Create the new address
    try {
      const address = await prisma.customerAddress.create({
        data: {
          fullName: data.fullName,
          mobile: data.mobile,
          address: data.address,
          city: data.city,
          province: data.province || '',
          postalCode: data.postalCode,
          isDefault: data.isDefault || false,
          customerId
        }
      });
      
      return NextResponse.json({ address }, { 
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (dbError) {
      console.error('Database error creating address:', dbError);
      return NextResponse.json({ error: 'Failed to create address in database' }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// PATCH: Update an existing customer address
export async function PATCH(req: NextRequest) {
  try {
    // Try to get session from NextAuth
    const session = await getServerSession(authOptions);
    let customerId = null;
    
    // Check if we have a valid session with userId
    if (session?.user?.id && session?.user?.type === 'customer') {
      customerId = session.user.id;
    } 
    // If no session, try JWT token
    else {
      // Try to get authenticated user from Bearer token
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token
        const token = authHeader.substring(7);
        
        try {
          // Verify the token
          const decodedToken = await verifyAuthToken(token);
          
          if (decodedToken && decodedToken.userId && decodedToken.type === 'customer') {
            // Set customerId from token
            customerId = decodedToken.userId;
          }
        } catch (tokenError) {
          console.error('Token verification failed for PATCH:', tokenError);
        }
      }
    }
    
    // No customer ID found, return unauthorized
    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Get request data and check URL parameters
    const { searchParams } = new URL(req.url);
    const urlId = searchParams.get('id');
    const urlDefault = searchParams.get('default') === 'true';
    
    console.log('PATCH request parameters:', { urlId, urlDefault });
    
    let requestData;
    try {
      requestData = await req.json();
      console.log('PATCH request body:', requestData);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ 
        error: 'Invalid request body - JSON parsing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    let { id, isDefault } = requestData;
    const { ...updateData } = requestData;
    
    // Prioritize ID from URL parameters if present
    if (urlId) {
      console.log('Using ID from URL parameters:', urlId);
      id = urlId;
    }
    
    // Check for default flag in URL if present
    if (urlDefault) {
      console.log('Using default flag from URL parameters');
      isDefault = true;
    }
    
    console.log('Final request parameters:', { id, isDefault });
    
    const isSettingDefault = isDefault === true;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Address ID is required',
        details: {
          urlParams: { id: urlId, default: urlDefault },
          bodyParams: requestData
        }
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Find address and verify ownership
    const address = await prisma.customerAddress.findUnique({
      where: { 
        id,
        // Only find non-deleted addresses
        deletedAt: null
       }
    });
    
    if (!address) {
      return NextResponse.json({ 
        error: 'Address not found',
        details: {
          addressId: id,
          customerId: customerId 
        }
      }, { 
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (address.customerId !== customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // If setting as default, update all other addresses to be non-default
    if (isSettingDefault) {
      await prisma.customerAddress.updateMany({
        where: { 
          customerId,
          id: { not: id },
          // Only update non-deleted addresses
          deletedAt: null
        },
        data: { isDefault: false }
      });
      
      // If only setting default and no other data is provided, just update isDefault
      if (Object.keys(updateData).length === 0 || (isDefault && Object.keys(updateData).length === 0)) {
        console.log('Only updating isDefault flag');
        const updatedAddress = await prisma.customerAddress.update({
          where: { id },
          data: { isDefault: true }
        });
        
        return NextResponse.json({ address: updatedAddress }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // Update the address
    try {
      const updatedAddress = await prisma.customerAddress.update({
        where: { id },
        data: {
          ...updateData,
          isDefault: isSettingDefault ? true : updateData.isDefault
        }
      });
      
      return NextResponse.json({ address: updatedAddress }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (dbError) {
      console.error('Database error updating address:', dbError);
      return NextResponse.json({ error: 'Failed to update address in database' }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// DELETE: Soft delete a customer address
export async function DELETE(req: NextRequest) {
  try {
    // Try to get session from NextAuth
    const session = await getServerSession(authOptions);
    let customerId = null;
    
    // Check if we have a valid session with userId
    if (session?.user?.id && session?.user?.type === 'customer') {
      customerId = session.user.id;
    } 
    // If no session, try JWT token
    else {
      // Try to get authenticated user from Bearer token
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token
        const token = authHeader.substring(7);
        
        try {
          // Verify the token
          const decodedToken = await verifyAuthToken(token);
          
          if (decodedToken && decodedToken.userId && decodedToken.type === 'customer') {
            // Set customerId from token
            customerId = decodedToken.userId;
          }
        } catch (tokenError) {
          console.error('Token verification failed for DELETE:', tokenError);
        }
      }
    }
    
    // No customer ID found, return unauthorized
    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Get address ID from URL or body
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    
    // If ID not in search params, try to get from request body
    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // If no JSON body or no ID in body, return error
        return NextResponse.json({ error: 'Address ID required' }, { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    if (!id) {
      return NextResponse.json({ error: 'Address ID required' }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Find address and verify ownership
    const address = await prisma.customerAddress.findUnique({
      where: { id }
    });
    
    if (!address) {
      return NextResponse.json({ 
        error: 'Address not found',
        details: {
          addressId: id,
          customerId: customerId 
        }
      }, { 
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (address.customerId !== customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Soft delete the address by setting deletedAt
    await prisma.customerAddress.update({
      where: { id },
      data: { 
        isDefault: false, // Make sure it's not the default address anymore
        deletedAt: new Date()
      }
    });
    
    // If this was the default address, set another one as default if exists
    if (address.isDefault) {
      const anotherAddress = await prisma.customerAddress.findFirst({
        where: { 
          customerId,
          deletedAt: null
        }
      });
      
      if (anotherAddress) {
        await prisma.customerAddress.update({
          where: { id: anotherAddress.id },
          data: { isDefault: true }
        });
      }
    }
    
    return NextResponse.json({ success: true }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 
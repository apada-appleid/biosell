import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';

// GET: Fetch user addresses
export async function GET(req: NextRequest) {
  try {
    // Try to get session from NextAuth
    const session = await getServerSession(authOptions);
    let userId = null;
    
    console.log('session', session);
    // Check if we have a valid session
    if (session?.user?.email) {
      // Get user from session email
      const sessionUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (sessionUser) {
        userId = sessionUser.id;
      }
    } 
    
    // If no session or no user found from session, try token from Authorization header
    if (!userId) {
      // Get authorization header
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token
        const token = authHeader.substring(7);
        console.log('Received auth token in header:', token ? 'Token exists' : 'No token');
        
        try {
          // Verify the token
          const decodedToken = await verifyAuthToken(token);
          console.log('Decoded token:', decodedToken);
          
          if (decodedToken && decodedToken.userId) {
            // Set userId from token
            userId = decodedToken.userId;
          }
        } catch (tokenError) {
          console.error('Token verification failed:', tokenError);
        }
      } else {
        console.log('No auth header found');
      }
    }

    console.log('userId', userId);
    
    // If no valid authentication found
    if (!userId) {
      console.log('No valid authentication found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch addresses for the authenticated user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { addresses: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ addresses: user.addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST: Create a new address
export async function POST(req: NextRequest) {
  try {
    // Try to get session from NextAuth
    const session = await getServerSession(authOptions);
    let userId = null;
    
    // Check if we have a valid session
    if (session?.user?.email) {
      // Get user from session email
      const sessionUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (sessionUser) {
        userId = sessionUser.id;
      }
    } 
    
    // If no session or no user found from session, try token from Authorization header
    if (!userId) {
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
            // Set userId from token
            userId = decodedToken.userId;
          }
        } catch (tokenError) {
          console.error('Token verification failed for POST:', tokenError);
        }
      } else {
        console.log('No auth header found for POST');
      }
    }
    
    // If no valid authentication found
    if (!userId) {
      console.log('No valid authentication found for POST');
      return NextResponse.json({ error: 'Unauthorized - لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
    }
    
    // Get user from userId
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.log('User not found for userId:', userId);
      return NextResponse.json({ error: 'User not found - کاربر یافت نشد' }, { status: 404 });
    }
    
    const data = await req.json();
    console.log('Address data received:', data);
    
    // Validate required fields
    const requiredFields = ['fullName', 'phone', 'address', 'city', 'province', 'postalCode'];
    for (const field of requiredFields) {
      if (!data[field]) {
        console.log('Missing required field:', field);
        return NextResponse.json({ error: `${field} is required - فیلد ${field} الزامی است` }, { status: 400 });
      }
    }
    
    // If this is the first address or isDefault is true, set all other addresses to non-default
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      });
    }
    
    // Create the new address
    try {
      const address = await prisma.address.create({
        data: {
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode,
          isDefault: data.isDefault || false,
          userId: user.id
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
    let userId = null;
    
    // Check if we have a valid session
    if (session?.user?.email) {
      // Get user from session email
      const sessionUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (sessionUser) {
        userId = sessionUser.id;
      }
    } 
    
    // If no session or no user found from session, try token from Authorization header
    if (!userId) {
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
            // Set userId from token
            userId = decodedToken.userId;
          }
        } catch (tokenError) {
          console.error('Token verification failed for PATCH:', tokenError);
        }
      } else {
        console.log('No auth header found for PATCH');
      }
    }
    
    // If no valid authentication found
    if (!userId) {
      console.log('No valid authentication found for PATCH');
      return NextResponse.json({ error: 'Unauthorized - لطفاً وارد حساب کاربری خود شوید' }, { status: 401 });
    }
    
    const data = await req.json();
    const { id, ...updateData } = data;
    
    if (!id) {
      return NextResponse.json({ error: 'Address ID is required - شناسه آدرس الزامی است' }, { status: 400 });
    }
    
    // Verify that the address belongs to the current user
    const address = await prisma.address.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!address) {
      return NextResponse.json({ error: 'Address not found - آدرس مورد نظر یافت نشد' }, { status: 404 });
    }
    
    if (address.userId !== userId) {
      console.log('User trying to update address that does not belong to them');
      return NextResponse.json({ error: 'Unauthorized - شما مجاز به ویرایش این آدرس نیستید' }, { status: 401 });
    }
    
    // If setting as default, update all other addresses to be non-default
    if (updateData.isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId: address.userId,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }
    
    // Update the address
    try {
      const updatedAddress = await prisma.address.update({
        where: { id },
        data: updateData
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
    let userId = null;
    
    // Check if we have a valid session
    if (session?.user?.email) {
      // Get user from session email
      const sessionUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (sessionUser) {
        userId = sessionUser.id;
      }
    } 
    
    // If no session or no user found from session, try token from Authorization header
    if (!userId) {
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
            // Set userId from token
            userId = decodedToken.userId;
          }
        } catch (tokenError) {
          console.error('Token verification failed for DELETE:', tokenError);
        }
      } else {
        console.log('No auth header found for DELETE');
      }
    }
    
    // If no valid authentication found
    if (!userId) {
      console.log('No valid authentication found for DELETE');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }
    
    // Verify that the address belongs to the current user
    const address = await prisma.address.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
    
    if (address.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Delete the address
    await prisma.address.delete({
      where: { id }
    });
    
    // If this was the default address, set another one as default if exists
    if (address.isDefault) {
      const anotherAddress = await prisma.address.findFirst({
        where: { userId: address.userId }
      });
      
      if (anotherAddress) {
        await prisma.address.update({
          where: { id: anotherAddress.id },
          data: { isDefault: true }
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
} 
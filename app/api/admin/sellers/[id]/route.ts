import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { validateUsername } from '@/lib/username-validator';

// Define params as a Promise according to Next.js 15 docs
type Params = Promise<{ id: string }>;

// This matches the exact format from Next.js docs for the App Router
export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params since it's now a Promise in Next.js 15
    const resolvedParams = await params;
    const sellerId = resolvedParams.id;

    // Fetch seller with active subscription and default shop
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        shops: {
          where: {
            isActive: true,
          },
          take: 1,
        },
        subscriptions: {
          where: {
            isActive: true,
            endDate: {
              gte: new Date(),
            },
          },
          include: {
            plan: true,
          },
          orderBy: {
            endDate: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Get default shop info
    const defaultShop = seller.shops.length > 0 ? seller.shops[0] : null;

    // Format the response
    const activeSubscription = seller.subscriptions[0];
    const formattedSeller = {
      id: seller.id,
      username: seller.username,
      email: seller.email,
      bio: seller.bio,
      profileImage: seller.profileImage,
      isActive: seller.isActive,
      createdAt: seller.createdAt.toISOString(),
      updatedAt: seller.updatedAt.toISOString(),
      // Include shop details
      defaultShop: defaultShop ? {
        id: defaultShop.id,
        shopName: defaultShop.shopName,
        instagramId: defaultShop.instagramId,
        isActive: defaultShop.isActive,
      } : null,
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            planId: activeSubscription.planId,
            planName: activeSubscription.plan.name,
            startDate: activeSubscription.startDate.toISOString(),
            endDate: activeSubscription.endDate.toISOString(),
            isActive: activeSubscription.isActive,
          }
        : null,
    };

    return NextResponse.json(formattedSeller);
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the seller ID from params
    const resolvedParams = await params;
    const sellerId = resolvedParams.id;

    // Parse request body
    const body = await req.json();
    
    // Prepare data for update
    const updateData: any = {};
    
    // Handle username update
    if (body.username) {
      // Validate the username format
      const usernameError = validateUsername(body.username);
      if (usernameError) {
        return NextResponse.json({ error: usernameError }, { status: 400 });
      }
      
      // Check if username is already taken
      const existingUser = await prisma.seller.findUnique({
        where: { username: body.username },
      });
      
      if (existingUser && existingUser.id !== sellerId) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
      
      updateData.username = body.username;
    }
    
    // Handle email update
    if (body.email) {
      // Check if email is already in use
      const existingEmail = await prisma.seller.findUnique({
        where: { email: body.email },
      });
      
      if (existingEmail && existingEmail.id !== sellerId) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      
      updateData.email = body.email;
    }
    
    // Handle password update
    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
      }
      
      updateData.password = await bcrypt.hash(body.password, 10);
    }
    
    // Handle other fields: bio, isActive, shopName
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    
    // Handle shop name update
    if (body.shopName) {
      // First find the default shop for this seller
      const defaultShop = await prisma.sellerShop.findFirst({
        where: {
          sellerId
        }
      });
      
      if (defaultShop) {
        // Update the shop name
        await prisma.sellerShop.update({
          where: { id: defaultShop.id },
          data: { shopName: body.shopName }
        });
      } else {
        // Create a new default shop if none exists
        await prisma.sellerShop.create({
          data: {
            sellerId,
            shopName: body.shopName,
            isActive: true
          }
        });
      }
    }
    
    // Update the seller
    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: updateData,
    });
    
    // Return updated seller without sensitive fields
    return NextResponse.json({
      id: updatedSeller.id,
      username: updatedSeller.username,
      email: updatedSeller.email,
      bio: updatedSeller.bio,
      isActive: updatedSeller.isActive,
    });
    
  } catch (error) {
    console.error('Error updating seller:', error);
    return NextResponse.json(
      { error: 'Failed to update seller' },
      { status: 500 }
    );
  }
} 
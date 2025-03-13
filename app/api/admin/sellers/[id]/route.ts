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

    // Fetch seller with active subscription
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
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

    // Format the response
    const activeSubscription = seller.subscriptions[0];
    const formattedSeller = {
      id: seller.id,
      username: seller.username,
      email: seller.email,
      shopName: seller.shopName,
      bio: seller.bio,
      profileImage: seller.profileImage,
      isActive: seller.isActive,
      createdAt: seller.createdAt.toISOString(),
      updatedAt: seller.updatedAt.toISOString(),
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

    // Await the params since it's now a Promise in Next.js 15
    const resolvedParams = await params;
    const sellerId = resolvedParams.id;
    
    const body = await req.json();
    const { username, email, password, shopName, bio, isActive } = body;

    // Check if seller exists
    const existingSeller = await prisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!existingSeller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Check for email uniqueness if email is being changed
    if (email && email !== existingSeller.email) {
      const sellerWithEmail = await prisma.seller.findUnique({
        where: { email },
      });
      if (sellerWithEmail) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Check for username uniqueness and validity if username is being changed
    if (username && username !== existingSeller.username) {
      // Check if username is valid (not reserved or has invalid format)
      const usernameError = validateUsername(username);
      if (usernameError) {
        return NextResponse.json({
          error: usernameError
        }, { status: 400 });
      }
      
      const sellerWithUsername = await prisma.seller.findUnique({
        where: { username },
      });
      if (sellerWithUsername) {
        return NextResponse.json(
          { error: 'Username already in use' },
          { status: 400 }
        );
      }
    }

    // Define a proper type for the update data
    interface SellerUpdateData {
      username?: string;
      email?: string;
      shopName?: string;
      bio?: string | null;
      isActive?: boolean;
      password?: string;
    }

    // Prepare update data
    const updateData: SellerUpdateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (shopName) updateData.shopName = shopName;
    if (bio !== undefined) updateData.bio = bio;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update seller
    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedSeller.id,
      username: updatedSeller.username,
      email: updatedSeller.email,
      shopName: updatedSeller.shopName,
      bio: updatedSeller.bio,
      isActive: updatedSeller.isActive,
      updatedAt: updatedSeller.updatedAt,
    });
  } catch (error) {
    console.error('Error updating seller:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
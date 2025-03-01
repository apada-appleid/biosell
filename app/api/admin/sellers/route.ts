import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all sellers with their active subscriptions
    const sellers = await prisma.seller.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedSellers = sellers.map((seller) => {
      const activeSubscription = seller.subscriptions[0];
      
      return {
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
              planName: activeSubscription.plan.name,
              endDate: activeSubscription.endDate.toISOString(),
              isActive: activeSubscription.isActive,
            }
          : null,
      };
    });

    return NextResponse.json(formattedSellers);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, email, password, shopName, bio, planId, subscriptionDuration } = body;

    // Validate required fields
    if (!username || !email || !password || !shopName || !planId || !subscriptionDuration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email or username already exists
    const existingSellerByEmail = await prisma.seller.findUnique({
      where: { email },
    });

    const existingSellerByUsername = await prisma.seller.findUnique({
      where: { username },
    });

    if (existingSellerByEmail) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    if (existingSellerByUsername) {
      return NextResponse.json(
        { error: 'Username already in use' },
        { status: 400 }
      );
    }

    // Get the plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Create seller with transaction to ensure both seller and subscription are created
    const result = await prisma.$transaction(async (tx) => {
      // Hash password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the seller
      const seller = await tx.seller.create({
        data: {
          username,
          email,
          password: hashedPassword,
          shopName,
          bio,
          isActive: true,
        },
      });

      // Calculate subscription end date
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + subscriptionDuration);

      // Create the subscription
      const subscription = await tx.subscription.create({
        data: {
          sellerId: seller.id,
          planId,
          startDate: new Date(),
          endDate,
          isActive: true,
        },
      });

      return { seller, subscription };
    });

    return NextResponse.json(
      {
        id: result.seller.id,
        username: result.seller.username,
        email: result.seller.email,
        shopName: result.seller.shopName,
        isActive: result.seller.isActive,
        subscription: {
          planId: result.subscription.planId,
          endDate: result.subscription.endDate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating seller:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
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

    // Fetch all sellers with their default shops
    const sellers = await prisma.seller.findMany({
      include: {
        shops: {
          where: {
            isActive: true,
          },
          take: 1,
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // For each seller, get active and pending subscriptions
    const formattedSellers = await Promise.all(
      sellers.map(async (seller) => {
        // Get the default shop if available
        const defaultShop = seller.shops.length > 0 ? seller.shops[0] : null;
        
        // Get active subscription
        const activeSubscription = await prisma.subscription.findFirst({
          where: {
            sellerId: seller.id,
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
        });

        // Get pending subscription with payment status
        const pendingSubscription = await prisma.subscription.findFirst({
          where: {
            sellerId: seller.id,
            isActive: false,
          },
          include: {
            plan: true,
            payments: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return {
          id: seller.id,
          username: seller.username,
          email: seller.email,
          bio: seller.bio,
          profileImage: seller.profileImage,
          isActive: seller.isActive,
          createdAt: seller.createdAt.toISOString(),
          updatedAt: seller.updatedAt.toISOString(),
          // Shop information
          shopName: defaultShop?.shopName || null, // For backward compatibility
          shop: defaultShop ? {
            id: defaultShop.id,
            shopName: defaultShop.shopName,
            instagramId: defaultShop.instagramId,
            isActive: defaultShop.isActive,
          } : null,
          // Active subscription info
          subscription: activeSubscription
            ? {
                id: activeSubscription.id,
                planId: activeSubscription.planId,
                planName: activeSubscription.plan.name,
                startDate: activeSubscription.startDate.toISOString(),
                endDate: activeSubscription.endDate.toISOString(),
                isActive: activeSubscription.isActive,
                maxProducts: activeSubscription.plan.maxProducts,
              }
            : null,
          // Pending subscription info
          pendingSubscription: pendingSubscription
            ? {
                id: pendingSubscription.id,
                planId: pendingSubscription.planId,
                planName: pendingSubscription.plan.name,
                startDate: pendingSubscription.startDate.toISOString(),
                endDate: pendingSubscription.endDate.toISOString(),
                isActive: pendingSubscription.isActive,
                maxProducts: pendingSubscription.plan.maxProducts,
                paymentStatus: pendingSubscription.payments[0]?.status || 'pending',
                paymentId: pendingSubscription.payments[0]?.id || null,
                payment: pendingSubscription.payments[0] 
                  ? {
                      id: pendingSubscription.payments[0].id,
                      status: pendingSubscription.payments[0].status,
                      amount: pendingSubscription.payments[0].amount,
                      createdAt: pendingSubscription.payments[0].createdAt.toISOString(),
                    }
                  : null,
              }
            : null,
        };
      })
    );

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

    // Create seller with transaction to ensure all entities are created
    const result = await prisma.$transaction(async (tx) => {
      // Hash password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the seller
      const seller = await tx.seller.create({
        data: {
          username,
          email,
          password: hashedPassword,
          bio,
          isActive: true,
        },
      });

      // Create the default shop
      const shop = await tx.sellerShop.create({
        data: {
          sellerId: seller.id,
          shopName,
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

      return { seller, shop, subscription };
    });

    return NextResponse.json(
      {
        id: result.seller.id,
        username: result.seller.username,
        email: result.seller.email,
        isActive: result.seller.isActive,
        shop: {
          id: result.shop.id,
          shopName: result.shop.shopName,
        },
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
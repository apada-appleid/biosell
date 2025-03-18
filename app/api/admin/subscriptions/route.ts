import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sellerId, planId, durationMonths, isActive } = body;

    // Validate required fields
    if (!sellerId || !planId || !durationMonths) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if seller exists
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Check if plan exists
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // If there's an active subscription, mark it as inactive
    if (isActive) {
      await prisma.subscription.updateMany({
        where: {
          sellerId: sellerId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        sellerId,
        planId,
        startDate,
        endDate,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      id: subscription.id,
      sellerId: subscription.sellerId,
      planId: subscription.planId,
      planName: subscription.plan.name,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      isActive: subscription.isActive,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all subscriptions with related seller and plan data
    const subscriptions = await prisma.subscription.findMany({
      include: {
        seller: true,
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
} 
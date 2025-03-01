import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In Next.js 15, params needs to be awaited directly
    const unwrappedParams = await params;
    const subscriptionId = unwrappedParams.id;

    // Fetch subscription with plan and seller info
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            shopName: true,
            email: true,
          },
        },
        plan: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedSubscription = {
      id: subscription.id,
      sellerId: subscription.sellerId,
      sellerUsername: subscription.seller.username,
      sellerShopName: subscription.seller.shopName,
      sellerEmail: subscription.seller.email,
      planId: subscription.planId,
      planName: subscription.plan.name,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      isActive: subscription.isActive,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedSubscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In Next.js 15, params needs to be awaited directly
    const unwrappedParams = await params;
    const subscriptionId = unwrappedParams.id;
    
    const body = await request.json();
    const { planId, endDate, isActive } = body;

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if plan exists if plan is being changed
    if (planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return NextResponse.json(
          { error: 'Plan not found' },
          { status: 404 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (planId) updateData.planId = planId;
    if (endDate) updateData.endDate = new Date(endDate);
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      
      // If activating this subscription, deactivate other active subscriptions for this seller
      if (isActive) {
        await prisma.subscription.updateMany({
          where: {
            sellerId: existingSubscription.sellerId,
            id: { not: subscriptionId },
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
      }
    }

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      id: updatedSubscription.id,
      planId: updatedSubscription.planId,
      planName: updatedSubscription.plan.name,
      startDate: updatedSubscription.startDate.toISOString(),
      endDate: updatedSubscription.endDate.toISOString(),
      isActive: updatedSubscription.isActive,
      updatedAt: updatedSubscription.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In Next.js 15, params needs to be awaited directly
    const unwrappedParams = await params;
    const subscriptionId = unwrappedParams.id;

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Delete subscription
    await prisma.subscription.delete({
      where: { id: subscriptionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
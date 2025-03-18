import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

// Define params as a Promise according to Next.js 15 docs
type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription ID from params
    const subscriptionId = (await params).id;

    // Fetch subscription with relations
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        seller: true,
        plan: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Look for a payment record for this subscription
    // Check orders table for any payment receipt related to this seller
    const order = await prisma.order.findFirst({
      where: {
        sellerId: subscription.sellerId,
        receiptInfo: { not: null },
      },
      select: {
        receiptInfo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If we found a receipt, process it and add to response
    let receiptInfo = null;
    if (order?.receiptInfo) {
      try {
        // Parse receipt info from string to JSON
        const receiptData = JSON.parse(order.receiptInfo as string);
        
        // Generate signed URL if there's a key
        if (receiptData.key) {
          const { getSignedReceiptUrl } = await import('@/utils/s3-storage');
          const signedUrl = await getSignedReceiptUrl(receiptData.key);
          
          receiptInfo = {
            ...receiptData,
            url: signedUrl
          };
        } else {
          receiptInfo = receiptData;
        }
      } catch (error) {
        console.error('Error processing receipt info:', error);
      }
    }

    // Return subscription with receipt info if available
    return NextResponse.json({
      ...subscription,
      receiptInfo
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}

// Update subscription status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription ID from params
    const subscriptionId = (await params).id;

    // Get update data from request body
    const body = await request.json();
    const { isActive, planId } = body;

    // Find the subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Handle status change
    if (isActive !== undefined) {
      updateData.isActive = isActive;

      // If activating this subscription, deactivate all other subscriptions for this seller
      if (isActive) {
        await prisma.subscription.updateMany({
          where: {
            sellerId: subscription.sellerId,
            id: { not: subscriptionId },
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
      }
    }

    // Handle plan change
    if (planId && planId !== subscription.planId) {
      // Verify that the plan exists
      const plan = await prisma.plan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        return NextResponse.json(
          { error: 'Plan not found' },
          { status: 404 }
        );
      }

      updateData.planId = planId;
      
      // We don't change the end date when updating plans
      // The current subscription end date remains valid
    }

    // If no updates were requested, return the current subscription
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(subscription);
    }

    // Update the subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        seller: true,
        plan: true,
      },
    });

    // Look for receipt info
    const order = await prisma.order.findFirst({
      where: {
        sellerId: updatedSubscription.sellerId,
        receiptInfo: { not: null },
      },
      select: {
        receiptInfo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Process receipt info if found
    let receiptInfo = null;
    if (order?.receiptInfo) {
      try {
        const receiptData = JSON.parse(order.receiptInfo as string);
        
        if (receiptData.key) {
          const { getSignedReceiptUrl } = await import('@/utils/s3-storage');
          const signedUrl = await getSignedReceiptUrl(receiptData.key);
          
          receiptInfo = {
            ...receiptData,
            url: signedUrl
          };
        } else {
          receiptInfo = receiptData;
        }
      } catch (error) {
        console.error('Error processing receipt info:', error);
      }
    }

    return NextResponse.json({
      ...updatedSubscription,
      receiptInfo
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const subscriptionId = resolvedParams.id;

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
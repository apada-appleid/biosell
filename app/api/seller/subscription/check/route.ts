import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    if (!session || session.user.type !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = session.user.id;
    
    // Check for active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        sellerId: sellerId,
        isActive: true,
        endDate: {
          gte: new Date()
        }
      }
    });

    // If no active subscription is found, check for pending subscriptions
    let pendingSubscription = null;
    if (!activeSubscription) {
      pendingSubscription = await prisma.subscription.findFirst({
        where: {
          sellerId: sellerId,
          isActive: false
        },
        include: {
          payments: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      });
    }

    return NextResponse.json({
      hasActiveSubscription: !!activeSubscription,
      hasPendingSubscription: !!pendingSubscription,
      pendingPaymentStatus: pendingSubscription?.payments[0]?.status || null,
      subscription: activeSubscription ? {
        id: activeSubscription.id,
        planId: activeSubscription.planId,
        endDate: activeSubscription.endDate
      } : null,
      pendingSubscription: pendingSubscription ? {
        id: pendingSubscription.id,
        planId: pendingSubscription.planId,
        status: pendingSubscription.payments[0]?.status || 'pending',
        endDate: pendingSubscription.endDate
      } : null
    });
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription', hasActiveSubscription: false, hasPendingSubscription: false },
      { status: 500 }
    );
  }
} 
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
    const subscription = await prisma.subscription.findFirst({
      where: {
        sellerId: sellerId,
        isActive: true,
        endDate: {
          gte: new Date()
        }
      }
    });

    return NextResponse.json({
      hasActiveSubscription: !!subscription,
      subscription: subscription ? {
        id: subscription.id,
        planId: subscription.planId,
        endDate: subscription.endDate
      } : null
    });
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription', hasActiveSubscription: false },
      { status: 500 }
    );
  }
} 
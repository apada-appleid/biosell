import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // Try session-based auth first
    const session = await getServerSession(authOptions);
    let isAdminAuthenticated = false;
    
    // Check if user is authenticated and is an admin via session
    if (session?.user?.id && session.user.type === 'admin') {
      isAdminAuthenticated = true;
    } 
    // Fall back to token-based auth
    else {
      const user = await getAuthenticatedUser(request);
      if (user && user.type === 'admin') {
        isAdminAuthenticated = true;
      }
    }

    if (!isAdminAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total sellers count
    const totalSellers = await prisma.seller.count();

    // Get total products count
    const totalProducts = await prisma.product.count();

    // Get active subscriptions count
    const activePlans = await prisma.subscription.count({
      where: {
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
    });

    // Calculate total income (sum of plan prices from active subscriptions)
    const subscriptions = await prisma.subscription.findMany({
      where: {
        isActive: true,
      },
      include: {
        plan: true,
      },
    });

    const totalIncome = subscriptions.reduce((acc, subscription) => {
      return acc + subscription.plan.price;
    }, 0);

    return NextResponse.json(
      {
        totalSellers,
        totalProducts,
        activePlans,
        totalIncome,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
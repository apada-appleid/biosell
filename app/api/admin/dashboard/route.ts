import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

export async function GET() {
  try {
    // Get session to check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.type !== 'admin') {
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
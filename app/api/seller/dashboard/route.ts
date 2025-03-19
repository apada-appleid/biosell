import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define types for orders
interface OrderProduct {
  title: string;
  price: number;
}

interface OrderBuyer {
  name: string;
  email: string;
}

interface RecentOrder {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  product: OrderProduct;
  buyer: OrderBuyer;
}

// GET - Fetch dashboard statistics for the authenticated seller
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    if (!session || session.user.type !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = session.user.id;

    // Get total number of products
    const totalProducts = await prisma.product.count({
      where: {
        sellerId: sellerId,
      },
    });

    // Get number of active products
    const activeProducts = await prisma.product.count({
      where: {
        sellerId: sellerId,
        isActive: true,
      },
    });

    // Get current subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        sellerId: sellerId,
        isActive: true,
        endDate: {
          gte: new Date()
        }
      },
      include: {
        plan: true
      }
    });

    // If no active subscription is found, check for pending subscriptions
    let pendingSubscription = null;
    if (!subscription) {
      pendingSubscription = await prisma.subscription.findFirst({
        where: {
          sellerId: sellerId,
          isActive: false
        },
        include: {
          plan: true,
          payments: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      });
    }

    // Mock data for sales metrics since we don't have an order model yet
    // In a real implementation, these would be fetched from the database
    const totalSales = 0;
    const totalRevenue = 0;
    
    // Mock data for recent orders
    const recentOrders: RecentOrder[] = [];

    // Calculate product limit progress
    const productLimitPercentage = subscription 
      ? Math.round((totalProducts / subscription.plan.maxProducts) * 100)
      : (pendingSubscription ? Math.round((totalProducts / pendingSubscription.plan.maxProducts) * 100) : 0);

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalSales,
      totalRevenue,
      subscription: subscription ? {
        planName: subscription.plan.name,
        maxProducts: subscription.plan.maxProducts,
        endDate: subscription.endDate,
        isActive: subscription.isActive
      } : (pendingSubscription ? {
        planName: pendingSubscription.plan.name,
        maxProducts: pendingSubscription.plan.maxProducts,
        endDate: pendingSubscription.endDate,
        isActive: pendingSubscription.isActive,
        status: pendingSubscription.payments[0]?.status || 'pending'
      } : null),
      productLimitPercentage,
      recentOrders
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 
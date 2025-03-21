import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { getSignedReceiptUrl } from '@/utils/s3-storage';

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
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get all payments with related data
    const payments = await prisma.planPayment.findMany({
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
            shops: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
                shopName: true,
              },
              take: 1,
            },
          }
        },
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Process receipt info for each payment
    const processedPayments = await Promise.all(payments.map(async (payment: any) => {
      const paymentResult = { ...payment };
      
      if (payment.receiptInfo) {
        try {
          // Parse receipt info
          const receiptData = typeof payment.receiptInfo === 'string' 
            ? JSON.parse(payment.receiptInfo as string)
            : payment.receiptInfo;
          
          // Generate a fresh signed URL if key exists
          if (receiptData.key) {
            const signedUrl = await getSignedReceiptUrl(receiptData.key);
            
            paymentResult.receiptInfo = {
              ...receiptData,
              url: signedUrl
            };
          } else {
            paymentResult.receiptInfo = receiptData;
          }
        } catch (error) {
          console.error('Error processing receipt info:', error);
          // Preserve original data on error
          paymentResult.receiptInfo = payment.receiptInfo;
        }
      }
      
      return paymentResult;
    }));
    
    return NextResponse.json({
      success: true,
      payments: processedPayments
    });
    
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown server error' 
      },
      { status: 500 }
    );
  }
} 
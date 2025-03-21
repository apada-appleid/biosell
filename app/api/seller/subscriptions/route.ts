import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { getSignedReceiptUrl } from '@/utils/s3-storage';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is a seller
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.type !== 'seller') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get seller ID from session
    const sellerId = session.user.id;
    
    // Get all subscriptions for this seller with related data
    const subscriptions = await prisma.subscription.findMany({
      where: {
        sellerId: sellerId
      },
      include: {
        plan: true,
        payments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Process receipt info for each payment
    const processedSubscriptions = await Promise.all(subscriptions.map(async (subscription: any) => {
      const subscriptionResult = { 
        ...subscription,
        plan: {
          ...subscription.plan,
          features: (() => {
            let features = [];
            try {
              if (typeof subscription.plan.features === 'string') {
                features = JSON.parse(subscription.plan.features);
              } else if (Array.isArray(subscription.plan.features)) {
                features = subscription.plan.features;
              } else if (subscription.plan.features && typeof subscription.plan.features === 'object') {
                features = Object.values(subscription.plan.features as Record<string, any>);
              }
            } catch (error) {
              console.error(`Error parsing features for plan ${subscription.plan.id}:`, error);
            }
            return Array.isArray(features) ? features : [];
          })()
        }
      };
      
      // Process payment receipts if any
      if (subscription.payments && subscription.payments.length > 0) {
        subscriptionResult.payments = await Promise.all(subscription.payments.map(async (payment: any) => {
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
      }
      
      return subscriptionResult;
    }));
    
    return NextResponse.json({
      success: true,
      subscriptions: processedSubscriptions
    });
    
  } catch (error) {
    console.error('Error fetching seller subscriptions:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown server error' 
      },
      { status: 500 }
    );
  }
} 
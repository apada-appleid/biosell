import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get session to check authentication
    const session = await getServerSession(authOptions);
    
    // Only authenticated sellers can subscribe to plans
    if (!session || session.user.type !== 'seller') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { success: false, message: 'Invalid request body format' },
        { status: 400 }
      );
    }
    
    const { planId, receiptInfo } = body;
    
    if (!planId || !receiptInfo) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get seller ID from session
    const sellerId = session.user.id;
    
    // Get the plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });
    
    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'Plan not found' },
        { status: 404 }
      );
    }
    
    // Process receipt info to ensure it's properly formatted for storage
    let receiptInfoJson;
    if (typeof receiptInfo === 'string') {
      try {
        receiptInfoJson = JSON.parse(receiptInfo);
      } catch (error) {
        receiptInfoJson = { rawData: receiptInfo };
      }
    } else {
      receiptInfoJson = receiptInfo;
    }
    
    // Calculate end date (30 days from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Wrap database operations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if there's an existing subscription
      const existingSubscription = await tx.subscription.findFirst({
        where: {
          sellerId: sellerId,
          isActive: true
        }
      });
      
      let subscription;
      
      if (existingSubscription) {
        // Update existing subscription
        subscription = await tx.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            planId: planId,
            startDate: startDate,
            endDate: endDate,
            isActive: false, // Make it pending until approved
          }
        });
      } else {
        // Create new subscription
        subscription = await tx.subscription.create({
          data: {
            sellerId: sellerId,
            planId: planId,
            startDate: startDate,
            endDate: endDate,
            isActive: false, // Make it pending until approved
          }
        });
      }
      
      // Create a payment record for the subscription
      const payment = await tx.planPayment.create({
        data: {
          subscriptionId: subscription.id,
          sellerId: sellerId,
          amount: plan.price,
          status: 'pending',
          receiptInfo: JSON.stringify(receiptInfoJson),
        }
      });
      
      return { subscription, payment };
    });
    
    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      payment: result.payment
    });
    
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown server error' 
    }, { 
      status: 500 
    });
  }
} 
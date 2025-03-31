import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { PlanPaymentStatus } from '@/app/types';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get payment ID from URL params
    const paymentId = (await params).id;
    
    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'Payment ID is required' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { status, notes } = body;
    
    // Validate status using enum values
    const validStatuses = [PlanPaymentStatus.approved, PlanPaymentStatus.rejected];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }
    
    // Find the payment
    const payment = await prisma.planPayment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: true
      }
    });
    
    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // If payment is already in the requested status, return successfully without changes
    if (payment.status === status) {
      return NextResponse.json({
        success: true,
        message: `Payment is already ${status}`,
        payment: payment
      });
    }
    
    // Update payment status
    const updatedPayment = await prisma.planPayment.update({
      where: { id: paymentId },
      data: {
        status: status as PlanPaymentStatus,
        notes: notes || undefined,
        reviewedAt: new Date(),
        reviewedBy: session.user.email,
      }
    });
    
    // If payment is approved, activate the subscription
    if (status === PlanPaymentStatus.approved) {
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          isActive: true
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      payment: updatedPayment
    });
    
  } catch (error) {
    console.error('Error reviewing payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown server error' 
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get order ID from params
    const orderId = (await params).id;

    // Fetch order with related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        seller: {
          select: {
            id: true,
            shopName: true,
            username: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobile: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: {
                  take: 1,
                  select: {
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Process receipt info if exists
    const processedOrder = { ...order };
    
    if (order.receiptInfo) {
      try {
        const receiptData = JSON.parse(order.receiptInfo as string);
        
        // Generate fresh signed URL if key exists
        if (receiptData.key) {
          const { getSignedReceiptUrl } = await import('@/utils/s3-storage');
          const signedUrl = await getSignedReceiptUrl(receiptData.key);
          
          processedOrder.receiptInfo = {
            ...receiptData,
            url: signedUrl
          };
        } else {
          processedOrder.receiptInfo = receiptData;
        }
      } catch (error) {
        console.error('Error processing receipt info:', error);
        // Keep original data if error occurs
        processedOrder.receiptInfo = order.receiptInfo;
      }
    }

    return NextResponse.json(processedOrder);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
} 
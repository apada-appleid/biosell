import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sellerId = searchParams.get('sellerId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = {};

    if (sellerId) where.sellerId = sellerId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where });

    // Fetch orders with relations
    const orders = await prisma.order.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
        shop: {
          select: {
            id: true,
            shopName: true,
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Process receipt info if exists
    const processedOrders = orders.map(order => {
      const processedOrder = { ...order };
      
      if (order.receiptInfo) {
        try {
          processedOrder.receiptInfo = JSON.parse(order.receiptInfo as string);
        } catch (error) {
          console.error('Error parsing receipt info:', error);
          // Keep as is if parsing fails
        }
      }
      
      return processedOrder;
    });

    return NextResponse.json({
      orders: processedOrders,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
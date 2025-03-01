import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get customerId from query params
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    
    // Validate that the requested customerId matches the authenticated user's ID
    if (!customerId || customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own orders' },
        { status: 403 }
      );
    }
    
    // Fetch orders for the customer
    const orders = await prisma.order.findMany({
      where: {
        customerId: customerId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform the data to match the expected format
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      })),
    }));
    
    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 
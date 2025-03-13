import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // First check for NextAuth session
    const session = await getServerSession(authOptions);
    let customerId = null;
    
    // If we have a valid session with a customer type user
    if (session?.user?.id && session.user.type === 'customer') {
      customerId = session.user.id;
    }
    // If we have a non-customer trying to access customer routes
    else if (session?.user?.type && session.user.type !== 'customer') {
      return NextResponse.json(
        { error: 'Access denied: Only customers can view orders' },
        { status: 403 }
      );
    } 
    // Try with token authentication as fallback
    else {
      // Check if customer is authenticated via token
      const user = await getAuthenticatedUser(request);
      
      // If authenticated but not a customer
      if (user && user.type !== 'customer') {
        return NextResponse.json(
          { error: 'Access denied: Only customers can view orders' },
          { status: 403 }
        );
      }
      
      // Set customerId if we have a valid customer
      if (user && user.type === 'customer') {
        customerId = user.userId;
      }
    }
    
    // Verify we have a customer ID
    if (!customerId) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid customer authentication required' },
        { status: 401 }
      );
    }
    
    // Get customerId from query params as additional security check
    const { searchParams } = new URL(request.url);
    const queryCustomerId = searchParams.get('customerId');
    
    // Validate that the requested customerId matches the authenticated user's ID
    if (queryCustomerId && queryCustomerId !== customerId) {
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
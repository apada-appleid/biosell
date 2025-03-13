import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// GET - Get a specific order for a seller
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orderId = (await params).id;
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Try session-based auth first
    const session = await getServerSession(authOptions);
    let sellerId: string | null = null;
    
    // Check if user is authenticated and is a seller via session
    if (session?.user?.id && session.user.type === 'seller') {
      sellerId = session.user.id;
    } 
    // Fall back to token-based auth
    else {
      const user = await getAuthenticatedUser(request);
      if (user && user.type === 'seller') {
        sellerId = user.userId;
      } else {
        return NextResponse.json(
          { error: "Unauthorized: Only sellers can access this endpoint" },
          { status: 401 }
        );
      }
    }

    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get order, ensuring it belongs to this seller
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        sellerId
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                images: {
                  select: {
                    id: true,
                    imageUrl: true
                  },
                  orderBy: {
                    order: 'asc'
                  },
                  take: 1
                }
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobile: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or not authorized to view this order" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

// PATCH - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orderId = (await params).id;
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Try session-based auth first
    const session = await getServerSession(authOptions);
    let sellerId: string | null = null;
    
    // Check if user is authenticated and is a seller via session
    if (session?.user?.id && session.user.type === 'seller') {
      sellerId = session.user.id;
    } 
    // Fall back to token-based auth
    else {
      const user = await getAuthenticatedUser(request);
      if (user && user.type === 'seller') {
        sellerId = user.userId;
      } else {
        return NextResponse.json(
          { error: "Unauthorized: Only sellers can update orders" },
          { status: 401 }
        );
      }
    }

    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the order belongs to this seller
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        sellerId
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found or you are not authorized to update this order" },
        { status: 404 }
      );
    }

    // Get update data
    const data = await request.json();
    const { status, trackingNumber, shippingProvider } = data;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 }
      );
    }

    // Define a proper type for order update data
    interface OrderUpdateData {
      status?: string;
      trackingNumber?: string;
      shippingProvider?: string;
      processedAt?: Date;
      shippedAt?: Date;
      deliveredAt?: Date;
    }

    // Prepare update data
    const updateData: OrderUpdateData = {};
    if (status) updateData.status = status;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (shippingProvider) updateData.shippingProvider = shippingProvider;

    // Add status update timestamp
    if (status === 'processing') updateData.processedAt = new Date();
    if (status === 'shipped') updateData.shippedAt = new Date();
    if (status === 'delivered') updateData.deliveredAt = new Date();
    if (status === 'cancelled') updateData.cancelledAt = new Date();

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId
      },
      data: updateData
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
} 
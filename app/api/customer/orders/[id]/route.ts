import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

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
    let customerId: string | null = null;
    
    // Check if user is authenticated and is a customer via session
    if (session?.user?.id && session.user.type === 'customer') {
      customerId = session.user.id;
    } 
    // If we have a non-customer trying to access customer routes
    else if (session?.user?.type && session.user.type !== 'customer') {
      return NextResponse.json(
        { error: 'Access denied: Only customers can view their orders' },
        { status: 403 }
      );
    }
    // Fall back to token-based auth
    else {
      const user = await getAuthenticatedUser(request);
      if (user && user.type === 'customer') {
        customerId = user.userId;
      } else {
        return NextResponse.json(
          { error: "Unauthorized: Only customers can access this endpoint" },
          { status: 401 }
        );
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the customer record
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Find the order, ensuring it belongs to this customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                description: true,
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
        seller: {
          select: {
            id: true,
            shopName: true,
            username: true
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// Define Order type with receiptInfo
type OrderWithReceiptInfo = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string | null;
  receiptInfo: string | null;
  items: any[];
  seller: {
    id: string;
    username: string;
  };
  shop: {
    id: string;
    shopName: string;
  };
  [key: string]: any; // Allow other properties
};

// Define a simpler approach that avoids TypeScript errors
interface OrderResult extends Record<string, any> {
  receiptInfo?: string | { key: string; url: string; bucket: string };
}

// A simplified type for order data with receiptInfo
interface OrderData extends Record<string, any> {
  receiptInfo?: string;
}

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
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        paymentMethod: true,
        paymentStatus: true,
        shippingAddress: true,
        createdAt: true,
        updatedAt: true,
        receiptInfo: true,
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
            username: true
          }
        },
        shop: {
          select: {
            id: true,
            shopName: true
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

    // Process receipt info and prepare for client
    let orderResult: any = { ...order };
    
    // Check if receipt info exists and process it
    if (order.receiptInfo) {
      try {
        const receiptData = JSON.parse(order.receiptInfo as string);
        
        // Generate a fresh signed URL if there's a key
        if (receiptData.key) {
          const { getSignedReceiptUrl } = await import('@/utils/s3-storage');
          const signedUrl = await getSignedReceiptUrl(receiptData.key);
          
          orderResult.receiptInfo = {
            ...receiptData,
            url: signedUrl
          };
        } else {
          orderResult.receiptInfo = receiptData;
        }
      } catch (error) {
        console.error('Error processing receipt info:', error);
        // Keep the original receipt info as is
        orderResult.receiptInfo = order.receiptInfo;
      }
    }

    return NextResponse.json(orderResult);
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

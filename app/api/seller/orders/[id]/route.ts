import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { OrderStatus, PaymentStatus } from "@/app/types";

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
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        paymentMethod: true,
        paymentStatus: true,
        shippingAddress: true,
        addressId: true,
        createdAt: true,
        updatedAt: true,
        receiptInfo: true,
        digitalProductInfo: true,
        customerId: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                requiresAddress: true,
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
            mobile: true,
            addresses: {
              where: {
                deletedAt: null
              },
              select: {
                id: true,
                fullName: true,
                mobile: true,
                address: true,
                city: true,
                province: true,
                postalCode: true,
                isDefault: true
              }
            }
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

    // Process order receipt info for viewing
    let processedOrder: any = { ...order };
    
    // Ensure customer object exists even if it's null in the database
    if (!processedOrder.customer) {
      processedOrder.customer = {
        id: processedOrder.customerId || '',
        fullName: '',
        email: '',
        mobile: '',
        addresses: []
      };
    }
    
    // Find customer address by addressId if available
    if (processedOrder.addressId && processedOrder.customer.addresses) {
      const selectedAddress = processedOrder.customer.addresses.find(
        (addr: any) => addr.id === processedOrder.addressId
      );
      
      if (selectedAddress) {
        // Format the address for display
        processedOrder.formattedAddress = `${selectedAddress.address}، ${selectedAddress.city}، ${selectedAddress.province}، کد پستی: ${selectedAddress.postalCode}، گیرنده: ${selectedAddress.fullName}، شماره تماس: ${selectedAddress.mobile}`;
      }
    }
    
    // If no formatted address is created but there's a shippingAddress string, use that
    if (!processedOrder.formattedAddress && processedOrder.shippingAddress) {
      processedOrder.formattedAddress = processedOrder.shippingAddress;
    }

    // Generate fresh signed URL for receipt images if available
    if (order.receiptInfo) {
      try {
        const receiptData = JSON.parse(order.receiptInfo as string);
        
        // Generate a fresh signed URL for the S3 object
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
        // Keep the original receipt info
        processedOrder.receiptInfo = order.receiptInfo;
      }
    }

    return NextResponse.json(processedOrder);
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

// PATCH - Update order status and seller notes
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
    const { status, trackingNumber, shippingProvider, sellerNotes } = data;
    
    // Define a type for order update data with proper types
    interface OrderUpdateData {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      processedAt?: Date;
      deliveredAt?: Date;
      cancelledAt?: Date;
      trackingNumber?: string;
      shippingProvider?: string;
      sellerNotes?: string;
      digitalProductInfo?: string;
    }

    // Prepare update data
    const updateData: OrderUpdateData = {};
    
    // Update order status if provided
    if (status) {
      // Validate status using the enum values
      const validStatuses = Object.values(OrderStatus);
      if (!validStatuses.includes(status as OrderStatus)) {
        return NextResponse.json(
          { error: "Invalid order status" },
          { status: 400 }
        );
      }
      
      updateData.status = status as OrderStatus;
      
      // Add status update timestamp and update payment status if completed
      if (status === OrderStatus.processing) {
        updateData.processedAt = new Date();
      } else if (status === OrderStatus.completed) {
        updateData.deliveredAt = new Date();
        updateData.paymentStatus = PaymentStatus.paid; // Set payment status to paid when order is completed
      } else if (status === OrderStatus.cancelled) {
        updateData.cancelledAt = new Date();
      }
    }
    
    // Update tracking information if provided
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (shippingProvider) updateData.shippingProvider = shippingProvider;
    
    // Update seller notes if provided
    if (sellerNotes !== undefined) {
      updateData.sellerNotes = sellerNotes;
    }
    
    // Update digital product info if provided
    if (data.digitalProductInfo !== undefined) {
      updateData.digitalProductInfo = data.digitalProductInfo;
    }
    
    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId
      },
      data: updateData
    });

    return NextResponse.json({
      message: "Order updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";

// Helper to generate a unique order number
function generateOrderNumber() {
  // Timestamp component - current time in milliseconds
  const timestamp = Date.now().toString();
  
  // Random component - random 4 digit number
  const random = Math.floor(Math.random() * 9000) + 1000;
  
  // Combine to create order number
  return `${timestamp.slice(-6)}${random}`;
}

export async function POST(request: Request) {
  // Store the request body outside the try block so it's available in catch
  let requestBody;
  
  try {
    const body = await request.json();
    requestBody = body; // Store for error handling
    const { customerData, cartItems, total, sellerId, paymentMethod, shippingAddress } = body;
    
    // Enhanced validation
    if (!customerData || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0 || !total || !sellerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate that all cart items have the required properties
    for (const item of cartItems) {
      if (!item.product || !item.product.id || !item.product.title || 
          typeof item.product.price !== 'number' || typeof item.quantity !== 'number') {
        return NextResponse.json(
          { error: "Invalid cart item data" },
          { status: 400 }
        );
      }
    }

    // Get authenticated user ID from the request token
    const authenticatedUserId = await getAuthenticatedUserId(request);
    
    if (authenticatedUserId) {
      console.log("Order being placed by authenticated user:", authenticatedUserId);
    } else {
      console.log("Order being placed by guest user (no valid auth token)");
      // Note: We allow unauthenticated users to place orders, but they need to provide full customer details
      if (!customerData.fullName || !customerData.phone || !customerData.email) {
        return NextResponse.json(
          { error: "Guest users must provide full customer information" },
          { status: 400 }
        );
      }
    }

    // Create or update customer record using upsert
    let customerId;
    
    if (authenticatedUserId) {
      // For authenticated users, find by phone or email
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: customerData.email },
            { mobile: customerData.contactPhone || customerData.phone }
          ]
        }
      });
      
      if (existingCustomer) {
        // Update existing customer with new info
        const updatedCustomer = await prisma.customer.update({
          where: {
            id: existingCustomer.id
          },
          data: {
            fullName: customerData.fullName,
            // Only update email if provided and different
            ...(customerData.email && customerData.email !== existingCustomer.email 
              ? { email: customerData.email } 
              : {}),
            // Don't update mobile/phone as it's verified
          }
        });
        customerId = updatedCustomer.id;
      } else {
        // Create new customer record for authenticated user
        const newCustomer = await prisma.customer.create({
          data: {
            fullName: customerData.fullName,
            email: customerData.email || "",
            mobile: customerData.contactPhone || customerData.phone,
          }
        });
        customerId = newCustomer.id;
      }
    } else {
      // Guest checkout - create a new customer
      const newCustomer = await prisma.customer.create({
        data: {
          fullName: customerData.fullName,
          email: customerData.email || "",
          mobile: customerData.contactPhone || customerData.phone,
          address: customerData.address,
          city: customerData.city,
          postalCode: customerData.postalCode,
          country: customerData.country || "ایران",
        }
      });
      customerId = newCustomer.id;
    }

    // Create order with the customer ID
    const orderNumber = generateOrderNumber();
    
    // Include delivery phone in shipping address since there's no separate field for it
    const finalShippingAddress = shippingAddress || 
      `${customerData.fullName}, ${customerData.deliveryPhone || customerData.contactPhone || customerData.phone}, ${customerData.address}, ${customerData.city}, ${customerData.postalCode}, ${customerData.country || "ایران"}`;
    
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        sellerId,
        total,
        paymentMethod: paymentMethod || "credit_card",
        shippingAddress: finalShippingAddress,
        items: {
          create: cartItems.map((item: any) => ({
            productId: item.product.id,
            title: item.product.title,
            price: item.product.price,
            quantity: item.quantity,
            totalPrice: item.product.price * item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Update product inventory (reduce by quantity ordered)
    for (const item of cartItems) {
      await prisma.product.update({
        where: { id: item.product.id },
        data: {
          inventory: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Order creation error:", error instanceof Error ? error.message : error);
    
    // Log more details about the request for debugging
    console.error("Order request data:", {
      hasCustomerData: !!requestBody?.customerData,
      hasAuthHeader: request.headers.has('Authorization'),
      email: requestBody?.customerData?.email ? requestBody.customerData.email.substring(0, 3) + "***" : "undefined", 
      phone: requestBody?.customerData?.phone ? requestBody.customerData.phone.substring(0, 3) + "***" : "undefined",
      cartItemsCount: requestBody?.cartItems?.length || 0,
    });
    
    // Provide more specific error messages based on error type
    let errorMessage = "Failed to create order";
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Check for Prisma-specific errors
      if (error.message.includes('Unique constraint failed')) {
        errorMessage = "Customer with this email or mobile already exists";
        statusCode = 400;
      } else if (error.message.includes('Foreign key constraint failed')) {
        errorMessage = "Invalid reference to product or seller";
        statusCode = 400;
      } else if (error.message.includes('field does not exist')) {
        // Schema error
        errorMessage = "Database schema error: " + error.message;
        statusCode = 500;
      } else if (error.message.includes('connect or create')) {
        // Relation error
        errorMessage = "Failed to link order data properly: " + error.message;
        statusCode = 500;
      } else {
        // Include the actual error message for debugging
        errorMessage = `Failed to create order: ${error.message}`;
      }
      
      // Log stack trace for server errors
      if (statusCode === 500) {
        console.error("Order creation stack trace:", error.stack);
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

// GET endpoint to fetch orders for a seller
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");
    
    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }
    
    const orders = await prisma.order.findMany({
      where: {
        sellerId,
      },
      include: {
        customer: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    
    // Provide more specific error messages based on error type
    let errorMessage = "Failed to fetch orders";
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Include the actual error message for debugging
      errorMessage = `Failed to fetch orders: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 
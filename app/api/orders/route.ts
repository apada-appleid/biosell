import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@/app/types";

// Helper to generate a unique order number
function generateOrderNumber() {
  // Timestamp component - current time in milliseconds
  const timestamp = Date.now().toString();

  // Random component - random 4 digit number
  const random = Math.floor(Math.random() * 9000) + 1000;

  // Combine to create order number
  return `${timestamp.slice(-6)}${random}`;
}

// Define a proper type for cart items
interface CartItem {
  product: {
    id: string;
    title: string;
    price: number;
  };
  quantity: number;
}

// TS interface for orderData
interface OrderData {
  orderNumber: string;
  customerId: string;
  sellerId: string;
  shopId: string;
  status: OrderStatus;
  total: number;
  paymentMethod: PaymentMethod;
  shippingAddress: string | null;
  addressId?: string; // Optional addressId field
  receiptInfo?: string; // Receipt information as JSON string
  items: {
    create: {
      productId: string;
      title: string;
      price: number;
      quantity: number;
      totalPrice: number;
    }[];
  };
  paymentStatus: PaymentStatus;
  customerNotes?: string;
}

// Define a proper type for the orders
// TODO: Define proper types for orders with relations instead of using 'any'
interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  totalPrice: number;
  product?: {
    id: string;
    title: string;
    price: number;
    images?: { imageUrl: string }[];
  };
}

interface OrderWithRelations {
  id: string;
  orderNumber: string;
  customerId: string;
  sellerId: string;
  shopId: string;
  status: string;
  total: number;
  paymentMethod: string;
  shippingAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  customer?: {
    id: string;
    fullName: string | null;
    email: string | null;
    mobile: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
  };
  seller?: {
    id: string;
    username: string;
  };
  shop?: {
    id: string;
    shopName: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerData,
      cartItems,
      total,
      sellerId,
      paymentMethod,
      shippingAddress,
      addressId,
      receiptInfo,
      customerNotes,
    } = body;

    // Enhanced validation
    if (
      !customerData ||
      !cartItems ||
      !Array.isArray(cartItems) ||
      cartItems.length === 0 ||
      !total ||
      !sellerId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate that all cart items have the required properties
    for (const item of cartItems) {
      if (
        !item.product ||
        !item.product.id ||
        !item.product.title ||
        typeof item.product.price !== "number" ||
        typeof item.quantity !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid cart item data" },
          { status: 400 }
        );
      }
    }

    // Validate customer data
    if (!customerData.fullName || !customerData.mobile || !customerData.email) {
      return NextResponse.json(
        { error: "Customer information is incomplete" },
        { status: 400 }
      );
    }

    // Try to get authenticated user
    let authenticatedUser = null;

    // Try session-based auth first
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      authenticatedUser = {
        userId: session.user.id,
        type: session.user.type,
      };
    }
    // Fall back to token-based auth
    else {
      authenticatedUser = await getAuthenticatedUser(request);
    }

    // Note: We allow unauthenticated users to place orders, but they need to provide full customer details
    if (
      !authenticatedUser?.userId &&
      (!customerData.fullName || !customerData.mobile || !customerData.email)
    ) {
      return NextResponse.json(
        { error: "Guest users must provide full customer information" },
        { status: 400 }
      );
    }

    // Fix the customer creation and ID assignment
    let customer;
    let customerId;
    if (authenticatedUser?.userId && authenticatedUser.type === "customer") {
      // For authenticated customers, find by mobile or email
      customer = await prisma.customer.findFirst({
        where: {
          OR: [{ email: customerData.email }, { mobile: customerData.mobile }],
        },
      });

      if (customer) {
        // Update existing customer with new info
        customer = await prisma.customer.update({
          where: {
            id: customer.id,
          },
          data: {
            fullName: customerData.fullName,
            // Only update email if provided and different
            ...(customerData.email && customerData.email !== customer.email
              ? { email: customerData.email }
              : {}),
            // Don't update mobile as it's verified
          },
        });
        customerId = customer.id;
      } else {
        // Create new customer record for authenticated user
        customer = await prisma.customer.create({
          data: {
            fullName: customerData.fullName,
            email: customerData.email,
            mobile: customerData.mobile,
            // Legacy fields kept for backward compatibility
            address: customerData.address,
            city: customerData.city,
            postalCode: customerData.postalCode,
            country: customerData.country || "ایران",
          },
        });
        customerId = customer.id;
      }
    } else {
      // Guest checkout - create a new customer
      customer = await prisma.customer.create({
        data: {
          fullName: customerData.fullName,
          email: customerData.email,
          mobile: customerData.mobile,
          address: customerData.address,
          city: customerData.city,
          postalCode: customerData.postalCode,
          country: customerData.country || "ایران",
        },
      });
      customerId = customer.id;
    }

    // Create order with the customer ID and address ID if available
    const orderNumber = generateOrderNumber();

    // Include delivery mobile in shipping address since there's no separate field for it
    const finalShippingAddress = customerData.address
      ? `${customerData.fullName}, ${
          customerData.deliveryMobile || customerData.mobile
        }, ${customerData.address}, ${customerData.city}, ${
          customerData.postalCode
        }, ${customerData.country || "ایران"}`
      : null;

    // Find the seller's default shop
    const sellerDefaultShop = await prisma.sellerShop.findFirst({
      where: {
        sellerId,
      },
    });

    if (!sellerDefaultShop) {
      return NextResponse.json(
        { error: "Seller's shop not found" },
        { status: 404 }
      );
    }

    // Create order data with base properties
    const orderData: OrderData = {
      orderNumber,
      customerId,
      sellerId,
      shopId: sellerDefaultShop.id,
      status: OrderStatus.pending,
      total,
      paymentMethod:
        (paymentMethod as PaymentMethod) || PaymentMethod.bank_transfer,
      shippingAddress: finalShippingAddress,
      items: {
        create: cartItems.map((item: CartItem) => ({
          productId: item.product.id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          totalPrice: item.product.price * item.quantity,
        })),
      },
      paymentStatus: PaymentStatus.pending,
      customerNotes: customerNotes || null,
    };

    // Add customer address ID if provided
    if (addressId) {
      // Verify address belongs to this customer
      const addressExists = await prisma.customerAddress.findFirst({
        where: {
          id: addressId,
          customerId: customerId,
          deletedAt: null,
        },
      });

      if (addressExists) {
        // Link address to order - no need for @ts-ignore now
        orderData.addressId = addressId;
      } else {
        console.warn(
          `Address ID ${addressId} not found for customer ${customerId} or is deleted`
        );
      }
    }

    // Add receipt info if available
    if (receiptInfo) {
      orderData.receiptInfo = JSON.stringify(receiptInfo);
    }

    // Create the order
    const order = await prisma.order.create({
      data: orderData,
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
    console.error(
      "Order creation error:",
      error instanceof Error ? error.message : error
    );

    // Provide more specific error messages based on error type
    let errorMessage = "Failed to create order";
    let statusCode = 500;

    if (error instanceof Error) {
      // Check for Prisma-specific errors
      if (error.message.includes("Unique constraint failed")) {
        errorMessage = "Customer with this email or mobile already exists";
        statusCode = 400;
      } else if (error.message.includes("Foreign key constraint failed")) {
        errorMessage = "Invalid reference to product or seller";
        statusCode = 400;
      } else if (error.message.includes("field does not exist")) {
        // Schema error
        errorMessage = "Database schema error: " + error.message;
        statusCode = 500;
      } else if (error.message.includes("connect or create")) {
        // Relation error
        errorMessage = "Failed to link order data properly: " + error.message;
        statusCode = 500;
      } else {
        // Include the actual error message for debugging
        errorMessage = `Failed to create order: ${error.message}`;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get authenticated user
    let authenticatedUser = null;

    // Try session-based auth first
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      authenticatedUser = {
        userId: session.user.id,
        type: session.user.type,
      };
    }
    // Fall back to token-based auth
    else {
      authenticatedUser = await getAuthenticatedUser(request);
    }

    if (!authenticatedUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Filter orders based on user type
    let orders: OrderWithRelations[] = [];

    if (authenticatedUser.type === "admin") {
      // Admins can see all orders
      orders = await prisma.order.findMany({
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (authenticatedUser.type === "seller") {
      // Sellers can only see orders for their products
      orders = await prisma.order.findMany({
        where: {
          sellerId: authenticatedUser.userId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (authenticatedUser.type === "customer") {
      // Customers can only see their own orders
      // First find the customer record that matches the authenticated user
      const customer = await prisma.customer.findFirst({
        where: {
          id: authenticatedUser.userId,
        },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      orders = await prisma.order.findMany({
        where: {
          customerId: customer.id,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

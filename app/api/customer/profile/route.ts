import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { OrderStatus } from "@/app/types";

// GET: Fetch customer profile
export async function GET(request: NextRequest) {
  try {
    // Try session-based auth first
    const session = await getServerSession(authOptions);
    let customerId: string | null = null;
    
    // Check if user is authenticated and is a customer via session
    if (session?.user?.id && session.user.type === 'customer') {
      customerId = session.user.id;
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

    // Fetch the customer profile - only selecting essential fields
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        addresses: {
          where: {
            deletedAt: null
          },
          orderBy: {
            isDefault: 'desc'
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer profile not found" },
        { status: 404 }
      );
    }

    // Get order counts and stats
    const orderCount = await prisma.order.count({
      where: { customerId }
    });

    const totalSpent = await prisma.order.aggregate({
      where: { 
        customerId,
        status: OrderStatus.completed
      },
      _sum: {
        total: true
      }
    });

    return NextResponse.json({
      ...customer,
      stats: {
        orderCount,
        totalSpent: totalSpent._sum.total || 0
      }
    });
  } catch (error) {
    console.error("Error fetching customer profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer profile" },
      { status: 500 }
    );
  }
}

// PATCH: Update customer profile
export async function PATCH(request: NextRequest) {
  try {
    // Try session-based auth first
    const session = await getServerSession(authOptions);
    let customerId: string | null = null;
    
    // Check if user is authenticated and is a customer via session
    if (session?.user?.id && session.user.type === 'customer') {
      customerId = session.user.id;
    } 
    // Fall back to token-based auth
    else {
      const user = await getAuthenticatedUser(request);
      if (user && user.type === 'customer') {
        customerId = user.userId;
      } else {
        return NextResponse.json(
          { error: "Unauthorized: Only customers can update their profile" },
          { status: 401 }
        );
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate update data - mobile field is now excluded from updates
    const { fullName, email } = data;
    
    if (!fullName && !email) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Define proper type for customer update data
    interface CustomerUpdateData {
      fullName?: string;
      email?: string;
    }

    // Create update object with only allowed fields
    const updateData: CustomerUpdateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    // Mobile is explicitly not included in updateData

    // Update customer profile
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true
      }
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer profile:", error);
    return NextResponse.json(
      { error: "Failed to update customer profile" },
      { status: 500 }
    );
  }
} 
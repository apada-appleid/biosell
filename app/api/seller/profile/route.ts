import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// GET: Fetch seller profile
export async function GET(request: NextRequest) {
  try {
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

    // Fetch the seller profile
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        username: true,
        email: true,
        shopName: true,
        bio: true,
        profileImage: true,
        createdAt: true,
        subscriptions: {
          where: {
            isActive: true,
            endDate: {
              gte: new Date(),
            },
          },
          include: {
            plan: true,
          },
          orderBy: {
            endDate: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller profile not found" },
        { status: 404 }
      );
    }

    // Get additional stats
    const productCount = await prisma.product.count({
      where: { sellerId },
    });

    const orderCount = await prisma.order.count({
      where: { sellerId },
    });

    return NextResponse.json({
      ...seller,
      stats: {
        productCount,
        orderCount,
      },
    });
  } catch (error) {
    console.error("Error fetching seller profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller profile" },
      { status: 500 }
    );
  }
}

// PATCH: Update seller profile
export async function PATCH(request: NextRequest) {
  try {
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
          { error: "Unauthorized: Only sellers can update their profile" },
          { status: 401 }
        );
      }
    }

    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate update data
    const { shopName, bio, email } = data;
    
    if (!shopName && !bio && !email) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Define a proper type for seller update data
    interface SellerUpdateData {
      shopName?: string;
      bio?: string;
      email?: string;
    }

    // Create update object with only provided fields
    const updateData: SellerUpdateData = {};
    if (shopName) updateData.shopName = shopName;
    if (bio) updateData.bio = bio;
    if (email) updateData.email = email;

    // Update seller profile
    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        shopName: true,
        bio: true,
        profileImage: true,
      },
    });

    return NextResponse.json(updatedSeller);
  } catch (error) {
    console.error("Error updating seller profile:", error);
    return NextResponse.json(
      { error: "Failed to update seller profile" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint to get shop information by ID without authentication
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const shopId = (await params).id;

    // Find the shop without requiring authentication
    const shop = await prisma.sellerShop.findUnique({
      where: {
        id: shopId,
        deletedAt: null, // Only non-deleted shops
        isActive: true,  // Only active shops
      },
      select: {
        id: true,
        shopName: true,
        instagramId: true,
        sellerId: true, // Include sellerId which is needed for checkout
        isActive: true,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ shop });
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    );
  }
} 
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import authOptions from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get a specific shop by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.type !== "seller") {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const sellerId = session.user.id;
    const shopId = (await params).id;

    const shop = await prisma.sellerShop.findFirst({
      where: {
        id: shopId,
        sellerId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!shop) {
      return NextResponse.json(
        { message: "Shop not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      shop: {
        ...shop,
        sellerId: shop.sellerId
      }
    });
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { message: "Failed to fetch shop" },
      { status: 500 }
    );
  }
}

// Update a specific shop
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.type !== "seller") {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const sellerId = session.user.id;
    const shopId = (await params).id;
    const body = await request.json();

    const { shopName, instagramId, description, isActive } = body;

    // Verify shop exists and belongs to this seller
    const shop = await prisma.sellerShop.findFirst({
      where: {
        id: shopId,
        sellerId,
        deletedAt: null,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { message: "Shop not found" },
        { status: 404 }
      );
    }

    // Update the shop
    const updatedShop = await prisma.sellerShop.update({
      where: {
        id: shopId,
      },
      data: {
        shopName,
        instagramId,
        description,
        isActive,
      },
    });

    return NextResponse.json({ 
      message: "Shop updated successfully", 
      shop: updatedShop 
    });
  } catch (error) {
    console.error("Error updating shop:", error);
    return NextResponse.json(
      { message: "Failed to update shop" },
      { status: 500 }
    );
  }
}

// Delete a specific shop
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.type !== "seller") {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const sellerId = session.user.id;
    const shopId = (await params).id;

    // Verify shop exists and belongs to this seller
    const shop = await prisma.sellerShop.findFirst({
      where: {
        id: shopId,
        sellerId,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!shop) {
      return NextResponse.json(
        { message: "Shop not found" },
        { status: 404 }
      );
    }

    // Check if the shop has products
    if (shop._count.products > 0) {
      return NextResponse.json(
        { message: "Cannot delete shop with existing products" },
        { status: 400 }
      );
    }

    // Soft delete the shop
    await prisma.sellerShop.update({
      where: {
        id: shopId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      message: "Shop deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting shop:", error);
    return NextResponse.json(
      { message: "Failed to delete shop" },
      { status: 500 }
    );
  }
} 
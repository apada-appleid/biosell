import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch shops associated with a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is a seller
    if (!session || session.user.type !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.user.id;
    const productId = (await params).id;

    // Verify the product exists and belongs to this seller
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        shop: {
          select: {
            sellerId: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.shop.sellerId !== sellerId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all shops associated with this product through the mapping table
    const productShops = await prisma.productShopMapping.findMany({
      where: {
        productId,
      },
    });

    return NextResponse.json({ shops: productShops });
  } catch (error) {
    console.error("Error fetching product shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch product shops" },
      { status: 500 }
    );
  }
}

// POST - Add product to multiple shops
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is a seller
    if (!session || session.user.type !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.user.id;
    const productId = (await params).id;
    const { shopIds } = await request.json();

    if (!Array.isArray(shopIds) || shopIds.length === 0) {
      return NextResponse.json(
        { error: "At least one shop ID is required" },
        { status: 400 }
      );
    }

    // Verify the product exists and belongs to this seller
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        shop: {
          select: {
            sellerId: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.shop.sellerId !== sellerId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify all shops belong to this seller
    const shops = await prisma.sellerShop.findMany({
      where: {
        id: {
          in: shopIds,
        },
        sellerId,
      },
    });

    if (shops.length !== shopIds.length) {
      return NextResponse.json(
        { error: "One or more shops do not belong to you" },
        { status: 403 }
      );
    }

    // Delete existing mappings
    await prisma.productShopMapping.deleteMany({
      where: {
        productId,
      },
    });

    // Create new mappings
    const mappings = await prisma.$transaction(
      shopIds.map((shopId) =>
        prisma.productShopMapping.create({
          data: {
            productId,
            shopId,
          },
        })
      )
    );

    return NextResponse.json({ success: true, mappings });
  } catch (error) {
    console.error("Error updating product shops:", error);
    return NextResponse.json(
      { error: "Failed to update product shops" },
      { status: 500 }
    );
  }
} 
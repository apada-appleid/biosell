import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const productId = (await params).id;

    // Fetch the product with complete shop information
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        deletedAt: null, // Only non-deleted products
        isActive: true,  // Only active products
      },
      include: {
        shop: {
          select: {
            id: true,
            shopName: true,
            sellerId: true,
          },
        },
        images: {
          select: {
            id: true,
            imageUrl: true,
            order: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        shops: {
          select: {
            shopId: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Process the product to include displayShops
    const displayShops = product.shops.map((mapping) => mapping.shopId);
    
    // Remove the shops array to avoid circular references
    const { shops, ...productWithoutShops } = product;
    
    return NextResponse.json({
      product: {
        ...productWithoutShops,
        displayShops,
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
} 
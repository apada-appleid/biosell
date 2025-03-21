import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

/**
 * API handlers for managing seller products by ID
 *
 * These handlers properly handle params in Next.js 15 by using async/await
 * since they are already server-side API routes.
 */

// GET - Fetch a specific product with the given ID
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

    // Get all shops for this seller
    const shops = await prisma.sellerShop.findMany({
      where: {
        sellerId,
      },
      select: {
        id: true,
      },
    });

    const shopIds = shops.map((shop) => shop.id);

    // Fetch the product with the given ID
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
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
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify the product belongs to one of the seller's shops
    if (product.shop.sellerId !== sellerId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT - Update a specific product
export async function PUT(
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
    const body = await request.json();

    // Verify the product exists and belongs to one of the seller's shops
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        shop: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify the product belongs to one of the seller's shops
    if (existingProduct.shop.sellerId !== sellerId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all shops for this seller
    const sellerShops = await prisma.sellerShop.findMany({
      where: { 
        sellerId,
        deletedAt: null // Only include non-deleted shops
      },
      select: { id: true }
    });
    
    const shopIds = sellerShops.map(shop => shop.id);

    // Prepare update data
    const updateData: any = {};

    // Update product details if provided
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.inventory !== undefined) updateData.inventory = body.inventory;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    
    // Handle shop ID update
    if (body.shopId !== undefined) {
      // Verify the shop belongs to this seller
      if (!shopIds.includes(body.shopId)) {
        return NextResponse.json(
          { error: "Invalid shop selection" },
          { status: 400 }
        );
      }
      updateData.shopId = body.shopId;
    }

    // Update the product with a transaction to ensure data consistency
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update the main product
      const product = await tx.product.update({
        where: {
          id: productId,
        },
        data: updateData,
        include: {
          images: true,
        },
      });

      // Handle shop mapping updates if shopIds is provided
      if (body.shopIds && Array.isArray(body.shopIds)) {
        // Validate that all shopIds belong to this seller
        const validShopIds = body.shopIds.filter((id: string) => shopIds.includes(id));
        
        if (validShopIds.length !== body.shopIds.length) {
          throw new Error("One or more selected shops do not belong to you");
        }
        
        // Delete existing mappings
        await tx.productShopMapping.deleteMany({
          where: {
            productId
          }
        });
        
        // Create new mappings
        for (const shopId of body.shopIds) {
          await tx.productShopMapping.create({
            data: {
              productId,
              shopId
            }
          });
        }
      }
      
      return product;
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific product
export async function DELETE(
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

    // Verify the product exists and belongs to the seller
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        shop: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify the product belongs to one of the seller's shops
    if (existingProduct.shop.sellerId !== sellerId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Soft delete the product by setting deletedAt
    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

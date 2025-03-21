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

    // Prepare update data
    const updateData: any = {};

    // Update product details if provided
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.inventory !== undefined) updateData.inventory = body.inventory;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.shopId !== undefined) {
      // Verify the shop belongs to this seller
      const shopBelongsToSeller = await prisma.sellerShop.findFirst({
        where: {
          id: body.shopId,
          sellerId,
        },
      });

      if (!shopBelongsToSeller) {
        return NextResponse.json(
          { error: "Invalid shop selection" },
          { status: 400 }
        );
      }

      updateData.shopId = body.shopId;
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: updateData,
      include: {
        images: true,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
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
        images: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify the product belongs to one of the seller's shops
    if (existingProduct.shop.sellerId !== sellerId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the product
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    // If the product had images, delete them from disk (if they're stored locally)
    // This is optional and will depend on how you manage image storage
    if (existingProduct.images && existingProduct.images.length > 0) {
      try {
        for (const image of existingProduct.images) {
          // Extract the filename from URL
          const url = new URL(image.imageUrl);
          const filename = url.pathname.split("/").pop();

          if (filename) {
            const filePath = join(process.cwd(), "public", "uploads", filename);
            await unlink(filePath).catch((err) => {
              console.warn(`Failed to delete image file: ${filePath}`, err);
            });
          }
        }
      } catch (error) {
        console.warn("Error while cleaning up product images:", error);
        // Continue with the deletion even if image cleanup fails
      }
    }

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

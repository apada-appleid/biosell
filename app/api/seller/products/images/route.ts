import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import authOptions from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { ProductImage } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session || session.user.type !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.user.id;

    // Ensure it's multipart/form-data
    const formData = await request.formData();
    const productId = formData.get("productId") as string;
    const images = formData.getAll("images") as File[];

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    // Verify that the product exists and belongs to the seller
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        sellerId: sellerId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create directories if they don't exist
    const publicDir = join(process.cwd(), "public");
    const uploadsDir = join(publicDir, "uploads");
    const productDir = join(uploadsDir, "products", productId);

    try {
      await mkdir(uploadsDir, { recursive: true });
      await mkdir(join(uploadsDir, "products"), { recursive: true });
      await mkdir(productDir, { recursive: true });
    } catch (error) {
      console.error("Error creating directories:", error);
    }

    // Process and save the images
    const savedImages = [];
    for (const image of images) {
      // Validate that it's an image
      if (!image.type.startsWith("image/")) {
        continue;
      }

      // Generate unique filename
      const fileExtension = image.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = join(productDir, fileName);
      const fileBuffer = Buffer.from(await image.arrayBuffer());

      // Save file to disk
      await writeFile(filePath, fileBuffer);

      // Create database record
      const productImage: ProductImage = await prisma.productImage.create({
        data: {
          productId,
          imageUrl: `/uploads/products/${productId}/${fileName}`,
          order: savedImages.length, // Sequential order
        },
      });

      savedImages.push(productImage);
    }

    return NextResponse.json(
      {
        success: true,
        images: savedImages,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading product images:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}

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

    // Ensure product directory exists
    const productDirectoryId = uuidv4(); // Generate consistent directory ID
    const baseUploadDir = join(process.cwd(), "public", "uploads", "products");
    const uploadDir = join(baseUploadDir, productDirectoryId);

    try {
      // First ensure base upload directory exists
      await mkdir(baseUploadDir, { recursive: true, mode: 0o755 });
      // Then create product-specific directory
      await mkdir(uploadDir, { recursive: true, mode: 0o755 });
      
      console.log('Upload directories created:', {
        baseUploadDir,
        uploadDir,
        cwd: process.cwd()
      });
    } catch (error) {
      console.error("Directory creation error:", error);
      console.error("Attempted paths:", {
        baseUploadDir,
        uploadDir,
        cwd: process.cwd()
      });
      return NextResponse.json({ error: "Failed to create upload directory" }, { status: 500 });
    }

    const savedImages: ProductImage[] = [];

    for (const image of images) {
      // Generate a normalized filename with UUID
      const imageId = uuidv4();
      const fileExtension = image.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${imageId}.${fileExtension}`;
      const filePath = join(uploadDir, fileName);
      
      // Save the file
      try {
        const buffer = Buffer.from(await image.arrayBuffer());
        await writeFile(filePath, buffer);
        
        // Create a standardized URL path that works across databases
        const dbPath = `/uploads/products/${productDirectoryId}/${fileName}`;
        
        // Save to database with consistent formatting
        const savedImage = await prisma.productImage.create({
          data: {
            productId,
            imageUrl: dbPath,
          },
        });
        
        savedImages.push(savedImage);
      } catch (error) {
        console.error("Error saving image:", error);
        console.error("File details:", {
          filePath,
          uploadDir,
          fileName
        });
        // Continue with other images even if one fails
      }
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

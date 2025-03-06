import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import authOptions from "@/lib/auth";
import { ProductImage } from "@prisma/client";
import { uploadFileToS3 } from "@/utils/s3-storage";

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

    const savedImages: ProductImage[] = [];

    // Process each image - upload to S3 and save URL to database
    for (const image of images) {
      try {
        // Upload to S3 storage - returns a full URL
        const s3ImageUrl = await uploadFileToS3(image, `products/${productId}`);
        
        // Save S3 URL to database
        const savedImage = await prisma.productImage.create({
          data: {
            productId,
            imageUrl: s3ImageUrl,
          },
        });
        
        savedImages.push(savedImage);
      } catch (error) {
        console.error("Error saving image:", error);
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

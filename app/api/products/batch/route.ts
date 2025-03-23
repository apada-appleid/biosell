import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get product IDs from query parameters
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get("ids");
    
    if (!idsParam) {
      return NextResponse.json(
        { error: "Product IDs are required" },
        { status: 400 }
      );
    }
    
    // Parse the comma-separated IDs
    const productIds = idsParam.split(",").filter(id => id.trim() !== "");
    
    if (productIds.length === 0) {
      return NextResponse.json(
        { error: "No valid product IDs provided" },
        { status: 400 }
      );
    }
    
    // Query the database for products with these IDs
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      include: {
        images: {
          orderBy: {
            order: 'asc'
          }
        },
        shop: {
          select: {
            id: true,
            shopName: true,
            sellerId: true
          }
        }
      }
    });
    
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching batch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
} 
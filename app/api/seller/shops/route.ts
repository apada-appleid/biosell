import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import authOptions from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get all shops for the authenticated seller
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.type !== "seller") {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const sellerId = session.user.id;

    const shops = await prisma.sellerShop.findMany({
      where: {
        sellerId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ shops });
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { message: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}

// Create a new shop for the authenticated seller
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.type !== "seller") {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const sellerId = session.user.id;
    const body = await request.json();
    
    const { shopName, instagramId, description } = body;

    if (!shopName) {
      return NextResponse.json(
        { message: "Shop name is required" },
        { status: 400 }
      );
    }

    // Check if this is the seller's first shop
    const existingShopsCount = await prisma.sellerShop.count({
      where: {
        sellerId,
      },
    });

    // Create the new shop
    const newShop = await prisma.sellerShop.create({
      data: {
        sellerId,
        shopName,
        instagramId,
        description,
        isDefault: existingShopsCount === 0, // Make default if it's the first shop
      },
    });

    return NextResponse.json(
      { message: "Shop created successfully", shop: newShop },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating shop:", error);
    return NextResponse.json(
      { message: "Failed to create shop" },
      { status: 500 }
    );
  }
} 
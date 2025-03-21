import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { validateUsername } from "@/lib/username-validator";

// Validation schema
const sellerRegisterSchema = z.object({
  shopName: z.string().min(3, "Shop name must be at least 3 characters").max(100, "Shop name must be at most 100 characters"),
  instagramId: z.string().min(3, "Instagram ID must be at least 3 characters").max(50, "Instagram ID must be at most 50 characters")
    .regex(/^[a-zA-Z0-9._]+$/, "Instagram ID can only contain letters, numbers, dots and underscores"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  mobile: z.string().regex(/^09\d{9}$/, "Invalid mobile number format"),
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate input
    const validation = sellerRegisterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors
      }, { status: 400 });
    }
    
    const { shopName, instagramId: rawInstagramId, email, password, mobile } = validation.data;
    
    // Remove @ from Instagram ID if present
    const instagramId = rawInstagramId.startsWith('@') ? rawInstagramId.substring(1) : rawInstagramId;
    
    // Check if seller's mobile already exists by looking at bio field
    const existingSellerWithMobile = await prisma.seller.findFirst({
      where: {
        bio: {
          contains: mobile
        }
      }
    });
    
    if (existingSellerWithMobile) {
      return NextResponse.json({
        success: false,
        error: "این شماره موبایل قبلاً ثبت شده است"
      }, { status: 400 });
    }
    
    // Check if seller already exists with this email
    const existingEmail = await prisma.seller.findUnique({
      where: { email }
    });
    
    if (existingEmail) {
      return NextResponse.json({
        success: false,
        error: "Email already in use"
      }, { status: 400 });
    }

    // Check if Instagram ID is already in use
    const existingInstagramId = await prisma.sellerShop.findFirst({
      where: { 
        instagramId,
        deletedAt: null // Only check active shops
      }
    });

    if (existingInstagramId) {
      return NextResponse.json({
        success: false,
        error: "Instagram ID is already associated with another shop"
      }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new seller with transaction to ensure both seller and shop are created
    const seller = await prisma.$transaction(async (tx) => {
      // Create the seller - use the mobile number as username
      const newSeller = await tx.seller.create({
        data: {
          username: mobile, // Use mobile as username
          email,
          password: hashedPassword,
          bio: `Mobile: ${mobile}`,
          isActive: true
        }
      });
      
      // Create the first shop for this seller with Instagram ID
      await tx.sellerShop.create({
        data: {
          sellerId: newSeller.id,
          shopName,
          instagramId, // Add the Instagram ID here
          isActive: true
        }
      });
      
      return newSeller;
    });
    
    // Return seller data without sensitive information
    return NextResponse.json({
      success: true,
      seller: {
        id: seller.id,
        username: seller.username,
        email: seller.email,
        shopName: shopName,
        instagramId: instagramId
      }
    });
    
  } catch (error) {
    console.error("Error registering seller:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to register seller"
    }, { status: 500 });
  }
} 
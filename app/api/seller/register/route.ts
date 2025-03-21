import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { validateUsername } from "@/lib/username-validator";

// Validation schema
const sellerRegisterSchema = z.object({
  shopName: z.string().min(3, "Shop name must be at least 3 characters").max(100, "Shop name must be at most 100 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username must be at most 50 characters"),
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
    
    const { shopName, username, email, password, mobile } = validation.data;
    
    // Check if username is valid (not reserved or has invalid format)
    const usernameError = validateUsername(username);
    if (usernameError) {
      return NextResponse.json({
        success: false,
        error: usernameError
      }, { status: 400 });
    }
    
    // Check if seller already exists
    const existingEmail = await prisma.seller.findUnique({
      where: { email }
    });
    
    if (existingEmail) {
      return NextResponse.json({
        success: false,
        error: "Email already in use"
      }, { status: 400 });
    }
    
    const existingUsername = await prisma.seller.findUnique({
      where: { username }
    });
    
    if (existingUsername) {
      return NextResponse.json({
        success: false,
        error: "Username already taken"
      }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new seller with transaction to ensure both seller and shop are created
    const seller = await prisma.$transaction(async (tx) => {
      // Create the seller
      const newSeller = await tx.seller.create({
        data: {
          username,
          email,
          password: hashedPassword,
          bio: `Mobile: ${mobile}`,
          isActive: true
        }
      });
      
      // Create the first shop for this seller
      await tx.sellerShop.create({
        data: {
          sellerId: newSeller.id,
          shopName,
          isDefault: true,
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
        email: seller.email
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
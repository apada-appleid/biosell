import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";

// GET: Fetch user profile
export async function GET(req: NextRequest) {
  try {
    // Try session-based auth first (NextAuth)
    const session = await getServerSession(authOptions);
    let userIdentifier: string | null = null;
    
    if (session?.user?.email) {
      userIdentifier = session.user.email;
    } else {
      // Fall back to JWT token authentication
      const userId = await getAuthenticatedUserId(req);
      if (userId) {
        userIdentifier = userId;
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Find user by email (session) or by ID (JWT)
    const user = await prisma.user.findFirst({
      where: session?.user?.email 
        ? { email: session.user.email }
        : { id: userIdentifier },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// PATCH: Update user profile
export async function PATCH(req: NextRequest) {
  try {
    // Try session-based auth first (NextAuth)
    const session = await getServerSession(authOptions);
    let userIdentifier: string | null = null;
    
    if (session?.user?.email) {
      userIdentifier = session.user.email;
    } else {
      // Fall back to JWT token authentication
      const userId = await getAuthenticatedUserId(req);
      if (userId) {
        userIdentifier = userId;
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Find user by email (session) or by ID (JWT)
    const user = await prisma.user.findFirst({
      where: session?.user?.email 
        ? { email: session.user.email }
        : { id: userIdentifier },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = await req.json();
    const updateData: any = {};

    // Only allow updating specific fields
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    
    // Now also allow email updates
    if (data.email && data.email !== user.email) {
      // Make sure the email is not already in use
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });
      
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
      
      updateData.email = data.email;
    }

    // Don't allow empty updates
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}

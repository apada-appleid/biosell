import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, getAuthenticatedUserId } from "@/lib/auth-helpers";

// GET: Fetch user profile
export async function GET(req: NextRequest) {
  try {
    // Try session-based auth first (NextAuth)
    const session = await getServerSession(authOptions);
    // Track authentication method and user info
    let authMethod = 'none';
    let userType: 'admin' | 'seller' | 'customer' | null = null;
    let userId: string | null = null;
    
    // If we have a session, extract user info
    if (session?.user?.id) {
      userId = session.user.id;
      userType = session.user.type;
      authMethod = 'session';
    } 
    // Fall back to JWT token authentication
    else {
      const user = await getAuthenticatedUser(req);
      if (user?.userId) {
        userId = user.userId;
        userType = user.type;
        authMethod = 'token';
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    
    // If we got here, we have authenticated user info
    if (!userId || !userType) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch the user profile based on the user type
    let profile = null;
    
    if (userType === 'admin') {
      profile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
        },
      });
    } 
    else if (userType === 'seller') {
      profile = await prisma.seller.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          bio: true,
          profileImage: true,
          isActive: true,
          shops: {
            where: {
            },
            select: {
              id: true,
              shopName: true,
              instagramId: true,
              isActive: true,
            },
            take: 1
          }
        },
      });

      // Process the profile to include default shop information in a more accessible format
      if (profile && profile.shops && profile.shops.length > 0) {
        const defaultShop = profile.shops[0];
        const profileWithShop: any = {
          ...profile,
          shopId: defaultShop.id,
          shopName: defaultShop.shopName, // For backward compatibility
          defaultShop: {
            id: defaultShop.id,
            shopName: defaultShop.shopName,
            instagramId: defaultShop.instagramId,
            isActive: defaultShop.isActive
          }
        };
        // Remove shops array to keep response clean
        delete profileWithShop.shops;
        profile = profileWithShop;
      }
    }
    else if (userType === 'customer') {
      profile = await prisma.customer.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          mobile: true,
        },
      });
    }

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      profile,
      userType,
      authMethod
    });
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
    
    // Define a proper type for user update data
    interface UserUpdateData {
      name?: string;
      mobile?: string;
      email?: string;
    }
    
    const updateData: UserUpdateData = {};

    // Only allow updating specific fields
    if (data.name) updateData.name = data.name;
    if (data.mobile) updateData.mobile = data.mobile;
    
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
        mobile: true,
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

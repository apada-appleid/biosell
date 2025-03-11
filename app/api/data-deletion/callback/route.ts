import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Schema for request validation
const dataDeleteSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  confirmation_code: z.string().optional(),
  platform: z.enum(["facebook", "instagram", "other"]).default("other"),
});

// Log deletion requests (in production, consider using a more sophisticated logging system)
const logDeletionRequest = (userId: string, platform: string) => {
  console.log(`[Data Deletion] Request received for user ${userId} from ${platform} at ${new Date().toISOString()}`);
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the request data
    const validationResult = dataDeleteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request data", 
          details: validationResult.error.format() 
        }, 
        { status: 400 }
      );
    }
    
    const { user_id, platform, confirmation_code } = validationResult.data;
    
    // Log the deletion request
    logDeletionRequest(user_id, platform);
    
    // Find the user record to delete
    // This will depend on how platform IDs are stored in your system
    // Here's a simplified example:
    const userToDelete = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: { contains: user_id } }, // In case user_id is an email or part of email
          { mobile: { contains: user_id } } // In case user_id is a mobile number
        ]
      }
    });
    
    if (!userToDelete) {
      // If no user is found, still return success to comply with platform requirements
      // but log this for internal tracking
      console.log(`[Data Deletion] No user found for ID ${user_id} from ${platform}`);
      return NextResponse.json({
        confirmation_code: confirmation_code || `no-user-${Date.now()}`,
        url: `https://biosell.me/legal/data-deletion-confirmation?code=${confirmation_code || "no-user"}`
      });
    }
    
    // For this example, we're going to anonymize the user data
    // In a real implementation, you would have a more comprehensive data deletion process
    await prisma.customer.update({
      where: { id: userToDelete.id },
      data: {
        fullName: `Deleted User ${userToDelete.id.substring(0, 8)}`,
        email: `deleted-${Date.now()}@example.com`,
        mobile: null,
        country: null,
        // We would also handle related data (addresses, orders, etc.) in a real implementation
      }
    });
    
    // In a real implementation, you would also:
    // 1. Delete or anonymize addresses
    // 2. Anonymize order information
    // 3. Delete any other personal data associated with this user
    
    // Return a success response with confirmation details
    // The exact format may depend on the requirements of the platform
    return NextResponse.json({
      confirmation_code: confirmation_code || `del-${Date.now()}`,
      url: `https://biosell.me/legal/data-deletion-confirmation?code=${confirmation_code || `del-${Date.now()}`}`
    });
    
  } catch (error) {
    console.error("[Data Deletion] Error processing deletion request:", error);
    
    // Return a 500 error response
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error", 
      }, 
      { status: 500 }
    );
  }
}

// Implement a status check endpoint as many platforms require this
export async function GET(request: NextRequest) {
  // Extract status ID from the URL if provided
  const statusId = request.nextUrl.searchParams.get('confirmation_code');
  
  if (statusId) {
    // In a real implementation, you would check the status of the deletion request
    // For this example, we'll just return a simulated status
    return NextResponse.json({
      status: "completed",
      completion_time: new Date().toISOString()
    });
  }
  
  // If no status ID is provided, return information about the API
  return NextResponse.json({
    service: "Biosell Data Deletion API",
    version: "1.0",
    status: "active",
    documentation: "https://biosell.me/legal/data-deletion"
  });
} 
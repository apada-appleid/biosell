import { verifyAuthToken } from "./jwt";

/**
 * Extracts the JWT token from a request's Authorization header
 * @param request The incoming request
 * @returns The JWT token or null if not found
 */
export function getJwtTokenFromRequest(request: Request): string | null {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return null;
    }
    
    // Extract token from Bearer format
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch || !tokenMatch[1]) {
      return null;
    }
    
    return tokenMatch[1];
  } catch (error) {
    console.error('Error extracting JWT token from request:', error);
    return null;
  }
}

/**
 * Verifies a JWT token and returns the user ID if valid
 * @param token The JWT token to verify
 * @returns The user information or null if invalid
 */
export async function verifyJwtToken(token: string) {
  if (!token) {
    return null;
  }
  
  try {
    // Use the existing auth token verification function
    const tokenData = await verifyAuthToken(token);
    
    if (!tokenData || !tokenData.userId) {
      return null;
    }
    
    return tokenData;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return null;
  }
}

/**
 * Gets the authenticated user information from a request if available
 * @param request The incoming request
 * @returns User information including ID and type, or null if not authenticated
 */
export async function getAuthenticatedUser(request: Request): Promise<{
  userId: string;
  type: "admin" | "seller" | "customer";
  role?: string;
  email?: string;
  mobile?: string;
  username?: string;
} | null> {
  const token = getJwtTokenFromRequest(request);
  
  if (!token) {
    return null;
  }
  
  const tokenData = await verifyJwtToken(token);
  if (!tokenData?.userId) {
    return null;
  }
  
  return {
    userId: tokenData.userId,
    type: tokenData.type || "customer", // Default to customer if not specified
    role: tokenData.role,
    email: tokenData.email,
    mobile: tokenData.mobile,
    username: tokenData.username
  };
}

/**
 * Gets the authenticated user ID from a request if available
 * @param request The incoming request
 * @returns The user ID or null if not authenticated
 */
export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const user = await getAuthenticatedUser(request);
  return user?.userId || null;
}

/**
 * Checks if the authenticated user has a specific type
 * @param request The incoming request
 * @param type The user type to check for
 * @returns True if the user is authenticated and has the specified type
 */
export async function isUserType(request: Request, type: "admin" | "seller" | "customer"): Promise<boolean> {
  const user = await getAuthenticatedUser(request);
  return user?.type === type;
}

/**
 * Checks if the authenticated user has admin role
 * @param request The incoming request
 * @returns True if the user is authenticated and is an admin
 */
export async function isAdmin(request: Request): Promise<boolean> {
  return await isUserType(request, "admin");
}

/**
 * Checks if the authenticated user is a seller
 * @param request The incoming request
 * @returns True if the user is authenticated and is a seller
 */
export async function isSeller(request: Request): Promise<boolean> {
  return await isUserType(request, "seller");
}

/**
 * Checks if the authenticated user is a customer
 * @param request The incoming request
 * @returns True if the user is authenticated and is a customer
 */
export async function isCustomer(request: Request): Promise<boolean> {
  return await isUserType(request, "customer");
} 
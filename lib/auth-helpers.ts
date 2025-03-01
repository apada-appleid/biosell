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
 * Gets the authenticated user ID from a request if available
 * @param request The incoming request
 * @returns The user ID or null if not authenticated
 */
export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const token = getJwtTokenFromRequest(request);
  
  if (!token) {
    return null;
  }
  
  const tokenData = await verifyJwtToken(token);
  return tokenData?.userId || null;
} 
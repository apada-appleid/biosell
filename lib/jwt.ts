import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  mobile?: string;
  email?: string;
  type: "admin" | "seller" | "customer";
}

interface AuthTokenPayload {
  userId: string;
  email?: string;
  mobile?: string;
  iat?: number;
  exp?: number;
}

export function signJwtAccessToken(
  payload: TokenPayload,
  options = {
    expiresIn: 60 * 60 * 24, // 1 day
  }
) {
  const secret = process.env.SECRET_KEY || "default-secret-key";
  return jwt.sign(payload, secret, options);
}

export function verifyJwtAccessToken(token: string) {
  try {
    const secret = process.env.SECRET_KEY || "default-secret-key";
    const decoded = jwt.verify(token, secret);
    return decoded as TokenPayload;
  } catch (error) {
    console.error("Error verifying JWT token:", error);
    return null;
  }
}

/**
 * Verifies an authentication token and returns the decoded payload
 * @param token The JWT token to verify
 * @returns The decoded token payload with userId or null if invalid
 */
export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const secret = process.env.SECRET_KEY || "default-secret-key";
    const decoded = jwt.verify(token, secret) as any;
    
    // Convert the token payload to include userId
    // This handles tokens that might have 'id' instead of 'userId'
    const authPayload: AuthTokenPayload = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      mobile: decoded.mobile,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    return authPayload;
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return null;
  }
}

import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Extending the built-in session types
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      type: string;
      username?: string;
    }
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    type: string;
    username?: string;
  }
}

declare module "next-auth/jwt" {
  /** Extending JWT with necessary properties */
  interface JWT {
    id: string;
    role?: string;
    type: string;
    username?: string;
  }
} 
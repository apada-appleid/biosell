import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"
import { UserRole } from "@/app/types"

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
      role?: UserRole;
      type: 'admin' | 'seller' | 'customer';
      username?: string;
      phone?: string;
      mobile?: string | null;
    }
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
    type: 'admin' | 'seller' | 'customer';
    username?: string;
    phone?: string;
    mobile?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** Extending JWT with necessary properties */
  interface JWT {
    id: string;
    role?: UserRole;
    type: 'admin' | 'seller' | 'customer';
    username?: string;
    phone?: string;
    mobile?: string | null;
  }
} 
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { User } from 'next-auth';

// Extend the JWT interface
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: string;
    type: string;
    username?: string;
    phone?: string;
  }
}

// Extend the User interface
declare module 'next-auth' {
  interface User {
    id: string;
    role?: string;
    type: string;
    username?: string;
    phone?: string;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      type: string;
      username?: string;
      phone?: string;
    }
  }
}

// Auth options configuration
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Invalid credentials');
          }

          // Check if this is admin login or seller login
          const isAdminLogin = credentials.role === 'admin';
          
          if (isAdminLogin) {
            const user = await prisma.user.findUnique({
              where: {
                email: credentials.email
              }
            });

            if (!user || !user?.password) {
              throw new Error('Invalid credentials');
            }

            const isCorrectPassword = await bcrypt.compare(
              credentials.password,
              user.password
            );

            if (!isCorrectPassword) {
              throw new Error('Invalid credentials');
            }

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              type: 'admin',
              phone: user.phone || undefined
            };
          } else {
            // Seller login
            const seller = await prisma.seller.findUnique({
              where: {
                email: credentials.email
              }
            });

            if (!seller || !seller?.password) {
              throw new Error('Invalid credentials');
            }

            const isCorrectPassword = await bcrypt.compare(
              credentials.password,
              seller.password
            );

            if (!isCorrectPassword) {
              throw new Error('Invalid credentials');
            }

            return {
              id: seller.id,
              name: seller.shopName,
              email: seller.email,
              username: seller.username,
              type: 'seller'
            };
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.type = user.type;
        token.username = user.username;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.type = token.type;
        session.user.username = token.username;
        session.user.phone = token.phone;
      }
      return session;
    }
  }
};

export default authOptions; 
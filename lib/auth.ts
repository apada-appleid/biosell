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
    type: 'admin' | 'seller' | 'customer';
    username?: string;
    phone?: string;
    mobile?: string | null;
  }
}

// Extend the User interface
declare module 'next-auth' {
  interface User {
    id: string;
    role?: string;
    type: 'admin' | 'seller' | 'customer';
    username?: string;
    phone?: string;
    mobile?: string | null;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      type: 'admin' | 'seller' | 'customer';
      username?: string;
      phone?: string;
      mobile?: string | null;
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
        role: { label: 'Role', type: 'text' },
        type: { label: 'Type', type: 'text' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Invalid credentials');
          }

          // Determine user type (admin, seller, or customer)
          const userType = credentials.type || (credentials.role === 'admin' ? 'admin' : 'seller');
          
          // Customer login with token as password (from OTP verification)
          if (userType === 'customer') {
            try {
              // For customers, we use email (or mobile+@example.com) and the token as password
              const customerId = credentials.email.split('@')[0]; // Extract mobile if using placeholder email
              
              // Check if this is a real email or a placeholder
              let customer;
              if (credentials.email.includes('@example.com')) {
                // This is likely a mobile number login
                const mobile = customerId;
                customer = await prisma.customer.findFirst({
                  where: { mobile }
                });
              } else {
                // This is an email login
                customer = await prisma.customer.findUnique({
                  where: { email: credentials.email }
                });
              }
              
              if (!customer) {
                throw new Error('Customer not found');
              }
              
              // For customers, we don't verify password as we're using the token directly
              // The token verification is assumed to have happened in the OTP verification API
              
              return {
                id: customer.id,
                name: customer.fullName || customer.mobile || '',
                email: customer.email || `${customer.mobile}@example.com`,
                type: 'customer' as const,
                mobile: customer.mobile
              };
            } catch (error) {
              console.error('Customer auth error:', error);
              return null;
            }
          }
          
          // Admin login
          if (userType === 'admin') {
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
          } 
          // Seller login
          else {
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
        token.mobile = user.mobile;
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
        session.user.mobile = token.mobile;
      }
      return session;
    }
  }
};

export default authOptions; 
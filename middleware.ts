import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
    const isSellerPage = req.nextUrl.pathname.startsWith('/seller');
    const isCustomerPage = req.nextUrl.pathname.startsWith('/customer');
    const isSellerRegisterPage = req.nextUrl.pathname === '/seller/register';
    const isSellerPlansPage = req.nextUrl.pathname === '/seller/plans';

    // Pages that don't require authentication
    const isPublicSellerPage = isSellerRegisterPage || isSellerPlansPage;

    // If not authenticated, redirect to appropriate login page
    if (!isAuth) {
      // Protect admin pages
      if (isAdminPage) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
      
      // Protect seller pages (except public ones)
      if (isSellerPage && !isPublicSellerPage) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
      
      // Protect customer pages
      if (isCustomerPage) {
        return NextResponse.redirect(new URL('/auth/customer-login', req.url));
      }
    }

    // Redirect away from login page if already authenticated
    if (isAuth && isAuthPage) {
      // Redirect to appropriate dashboard based on user type
      if (token.type === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      } else if (token.type === 'seller') {
        return NextResponse.redirect(new URL('/seller/dashboard', req.url));
      } else if (token.type === 'customer') {
        return NextResponse.redirect(new URL('/customer/dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Prevent accessing sections meant for other user types
    if (isAuth) {
      // Redirect non-admins away from admin pages
      if (isAdminPage && token.type !== 'admin') {
        if (token.type === 'seller') {
          return NextResponse.redirect(new URL('/seller/dashboard', req.url));
        } else if (token.type === 'customer') {
          return NextResponse.redirect(new URL('/customer/dashboard', req.url));
        }
        return NextResponse.redirect(new URL('/', req.url));
      }

      // Redirect non-sellers away from seller pages (except public ones)
      if (isSellerPage && token.type !== 'seller' && !isPublicSellerPage) {
        if (token.type === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        } else if (token.type === 'customer') {
          return NextResponse.redirect(new URL('/customer/dashboard', req.url));
        }
        return NextResponse.redirect(new URL('/', req.url));
      }
      
      // Redirect non-customers away from customer pages
      if (isCustomerPage && token.type !== 'customer') {
        if (token.type === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        } else if (token.type === 'seller') {
          return NextResponse.redirect(new URL('/seller/dashboard', req.url));
        }
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run the authorization check on protected routes
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow access to auth routes and public seller pages without authentication
        if (pathname.startsWith('/auth/') || 
            pathname === '/seller/register' || 
            pathname === '/seller/plans') {
          return true;
        }
        
        // Require token for other protected routes
        return !!token;
      },
    }
  }
);

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/admin/:path*', '/seller/:path*', '/customer/:path*', '/auth/:path*'],
}; 
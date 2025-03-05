import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';

// Function to log the request (in production this could be replaced with a proper logging system)
const logRequest = (req: Request, info: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${info} - ${req.method} ${req.url}`);
  }
};

export default withAuth(
  async function middleware(req) {
    try {
      const token = await getToken({ req });
      const isAuth = !!token;
      const pathname = req.nextUrl.pathname;

      // Fast path for static assets and public pages
      if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/static/') ||
        pathname.startsWith('/api/') ||
        pathname.includes('.') ||
        pathname === '/' || // Homepage
        pathname.startsWith('/shop/') || // Shop pages
        pathname.startsWith('/products/') || // Product pages
        pathname === '/cart' || // Cart page
        pathname.startsWith('/checkout') // Checkout pages
      ) {
        return NextResponse.next();
      }

      const isAuthPage = pathname.startsWith('/auth');
      const isAdminPage = pathname.startsWith('/admin');
      const isSellerPage = pathname.startsWith('/seller');
      const isCustomerPage = pathname.startsWith('/customer');
      const isSellerRegisterPage = pathname === '/seller/register';
      const isSellerPlansPage = pathname === '/seller/plans';

      // Pages that don't require authentication
      const isPublicSellerPage = isSellerRegisterPage || isSellerPlansPage;

      // If not authenticated, redirect to appropriate login page
      if (!isAuth) {
        // Protect admin pages
        if (isAdminPage) {
          logRequest(req, 'Redirecting unauthenticated user from admin page to login');
          return NextResponse.redirect(new URL('/auth/login', req.url));
        }
        
        // Protect seller pages (except public ones)
        if (isSellerPage && !isPublicSellerPage) {
          logRequest(req, 'Redirecting unauthenticated user from seller page to login');
          return NextResponse.redirect(new URL('/auth/login', req.url));
        }
        
        // Protect customer pages
        if (isCustomerPage) {
          logRequest(req, 'Redirecting unauthenticated user from customer page to login');
          return NextResponse.redirect(new URL('/auth/customer-login', req.url));
        }
      }

      // Redirect away from login page if already authenticated
      if (isAuth && isAuthPage) {
        // Redirect to appropriate dashboard based on user type
        if (token.type === 'admin') {
          logRequest(req, 'Redirecting authenticated admin from auth page to dashboard');
          return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        } else if (token.type === 'seller') {
          logRequest(req, 'Redirecting authenticated seller from auth page to dashboard');
          return NextResponse.redirect(new URL('/seller/dashboard', req.url));
        } else if (token.type === 'customer') {
          logRequest(req, 'Redirecting authenticated customer from auth page to dashboard');
          return NextResponse.redirect(new URL('/customer/dashboard', req.url));
        }
        return NextResponse.redirect(new URL('/', req.url));
      }

      // Prevent accessing sections meant for other user types
      if (isAuth) {
        // Redirect non-admins away from admin pages
        if (isAdminPage && token.type !== 'admin') {
          logRequest(req, `Redirecting ${token.type} away from admin page`);
          if (token.type === 'seller') {
            return NextResponse.redirect(new URL('/seller/dashboard', req.url));
          } else if (token.type === 'customer') {
            return NextResponse.redirect(new URL('/customer/dashboard', req.url));
          }
          return NextResponse.redirect(new URL('/', req.url));
        }

        // Redirect non-sellers away from seller pages (except public ones)
        if (isSellerPage && token.type !== 'seller' && !isPublicSellerPage) {
          logRequest(req, `Redirecting ${token.type} away from seller page`);
          if (token.type === 'admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', req.url));
          } else if (token.type === 'customer') {
            return NextResponse.redirect(new URL('/customer/dashboard', req.url));
          }
          return NextResponse.redirect(new URL('/', req.url));
        }
        
        // Redirect non-customers away from customer pages
        if (isCustomerPage && token.type !== 'customer') {
          logRequest(req, `Redirecting ${token.type} away from customer page`);
          if (token.type === 'admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', req.url));
          } else if (token.type === 'seller') {
            return NextResponse.redirect(new URL('/seller/dashboard', req.url));
          }
          return NextResponse.redirect(new URL('/', req.url));
        }
      }

      return NextResponse.next();
    } catch (error) {
      console.error('[Middleware Error]', error);
      // If we hit an error, allow the request to continue and let the page handle the error
      return NextResponse.next();
    }
  },
  {
    callbacks: {
      // Only run the authorization check on protected routes
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Fast path for static assets, API routes, and public pages
        if (
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/static/') ||
          pathname.includes('.') ||
          pathname === '/' || // Homepage
          pathname.startsWith('/shop/') || // Shop pages
          pathname.startsWith('/products/') || // Product pages
          pathname === '/cart' || // Cart page
          pathname.startsWith('/checkout') // Checkout pages
        ) {
          return true;
        }
        
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
  matcher: [
    '/admin/:path*', 
    '/seller/:path*', 
    '/customer/:path*', 
    '/auth/:path*',
    // Exclude static files, api routes, the homepage, shop pages, product pages, cart, and checkout from the middleware
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg)|api/|$|shop/|products/|cart|checkout).*)'
  ],
}; 
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

    // Redirect to login if trying to access protected routes without authentication
    if (!isAuth && (isAdminPage || isSellerPage)) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Redirect away from login page if already authenticated
    if (isAuth && isAuthPage) {
      // Redirect to appropriate dashboard based on user type
      if (token.type === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      } else if (token.type === 'seller') {
        return NextResponse.redirect(new URL('/seller/dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Prevent sellers from accessing admin pages and vice versa
    if (isAuth && isAdminPage && token.type !== 'admin') {
      return NextResponse.redirect(new URL('/seller/dashboard', req.url));
    }

    if (isAuth && isSellerPage && token.type !== 'seller') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run the authorization check on admin and seller routes, not auth routes
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Allow access to auth routes without authentication
        if (pathname.startsWith('/auth/')) {
          return true;
        }
        // Require token for other protected routes
        return !!token;
      },
    },
  }
);

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/admin/:path*', '/seller/:path*', '/auth/:path*'],
}; 
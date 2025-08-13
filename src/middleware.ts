
import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { UserForToken } from '@/lib/jwt';

// Define paths that are always public and don't require login
const publicPaths = ['/login', '/account/forgot-password', '/account/reset-password'];

// Define the home/dashboard for each role
const roleHomepages: { [key: number]: string } = {
    1: '/superadmin', // Super Admin
    2: '/admin',      // Admin
    3: '/account/profile', // Regular User
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // Allow static files and internal Next.js requests to pass through
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
        return NextResponse.next();
    }

    if (refreshToken) {
        let decoded: UserForToken;
        try {
            decoded = jwtDecode(refreshToken);
        } catch (err) {
            // If token is invalid, treat as unauthenticated
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('refreshToken');
            return response;
        }

        const userRole = decoded.role;
        const userDashboard = roleHomepages[userRole] || '/';

        // If a logged-in user tries to access the login page, redirect them to their dashboard
        if (pathname === '/login') {
            return NextResponse.redirect(new URL(userDashboard, request.url));
        }

        // --- Role-based access control for admin pages ---
        if (pathname.startsWith('/superadmin') && userRole !== 1) {
            return NextResponse.redirect(new URL(userDashboard, request.url));
        }
        if (pathname.startsWith('/admin') && userRole !== 1 && userRole !== 2) {
             return NextResponse.redirect(new URL(userDashboard, request.url));
        }
        
    } else {
        // --- Unauthenticated User ---
        // If the user is not logged in and tries to access any non-public page, redirect to login
        if (!publicPaths.some(path => pathname.startsWith(path))) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // If no rules matched, allow the request to proceed
    return NextResponse.next();
}

export const config = {
  // This matcher ensures the middleware runs on all paths except for static assets.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sounds|icon-).*)',
  ],
};

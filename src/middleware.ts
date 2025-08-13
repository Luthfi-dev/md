
import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { UserForToken } from '@/lib/jwt';

// Define public paths that are accessible without authentication
const publicPaths = [
    '/login',
    '/account',
    '/account/forgot-password',
    '/account/reset-password',
    '/explore',
    '/pricing',
    '/converter',
    '/scanner',
    '/calculator',
    '/unit-converter',
    '/color-generator',
    '/stopwatch',
    '/surat-generator',
    '/surat/shared-template',
];

// Define protected paths that require authentication
const protectedPaths = [
    '/account/profile',
    '/account/edit-profile',
    '/account/security',
    '/account/notifications',
    '/account/settings',
    '/account/invite',
    '/messages',
    '/notebook',
    '/wallet'
];

const adminPaths = ['/admin'];
const superAdminPaths = ['/superadmin'];

const isPathPrefixOf = (path: string, prefixes: string[]): boolean => {
    for (const prefix of prefixes) {
        if (path.startsWith(prefix)) return true;
    }
    return false;
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // Allow static files and API routes to pass through
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
        return NextResponse.next();
    }

    if (refreshToken) {
        try {
            const decoded = jwtDecode(refreshToken) as UserForToken;
            const userRole = decoded.role;

            // If user is authenticated and tries to access login page, redirect to home
            if (pathname === '/account' || pathname === '/login') {
                return NextResponse.redirect(new URL('/', request.url));
            }

            // Check authorization for superadmin routes
            if (isPathPrefixOf(pathname, superAdminPaths) && userRole !== 1) {
                // If not a superadmin, redirect to home
                return NextResponse.redirect(new URL('/', request.url));
            }

            // Check authorization for admin routes
            if (isPathPrefixOf(pathname, adminPaths) && userRole !== 1 && userRole !== 2) {
                // If not an admin or superadmin, redirect to home
                return NextResponse.redirect(new URL('/', request.url));
            }

        } catch (err) {
            // Invalid or expired token
            const response = NextResponse.redirect(new URL('/account', request.url));
            response.cookies.delete('refreshToken'); // Clear the bad cookie
            return response;
        }
    } else {
        // User is not authenticated
        const isProtectedRoute = isPathPrefixOf(pathname, protectedPaths) || isPathPrefixOf(pathname, adminPaths) || isPathPrefixOf(pathname, superAdminPaths);

        if (isProtectedRoute) {
            // If trying to access a protected route without a token, redirect to login
            return NextResponse.redirect(new URL('/account', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};

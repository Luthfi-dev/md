
import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { UserForToken } from '@/lib/jwt';

// Define public paths that are accessible without authentication
const publicPaths = [
    '/',
    '/login',
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
    '/account',
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
        let decoded: UserForToken;
        try {
            decoded = jwtDecode(refreshToken) as UserForToken;
        } catch (err) {
            // Invalid refresh token, clear it and redirect to login
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('refreshToken');
            return response;
        }
        
        const userRole = decoded.role;

        // If user is authenticated and tries to access login page, redirect them away.
        if (pathname === '/login') {
             return NextResponse.redirect(new URL('/', request.url));
        }

        // Check authorization for superadmin routes
        if (isPathPrefixOf(pathname, superAdminPaths) && userRole !== 1) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Check authorization for admin routes
        if (isPathPrefixOf(pathname, adminPaths) && userRole !== 1 && userRole !== 2) {
            return NextResponse.redirect(new URL('/', request.url));
        }

    } else {
        // User is not authenticated
        const isProtectedRoute = isPathPrefixOf(pathname, protectedPaths) || isPathPrefixOf(pathname, adminPaths) || isPathPrefixOf(pathname, superAdminPaths);

        // If trying to access a protected route without a token, redirect to login
        if (isProtectedRoute) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Allow the request to proceed if no other conditions were met
    return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};

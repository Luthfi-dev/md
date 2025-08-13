
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
    '/converter/image-to-pdf',
    '/converter/pdf-to-word',
    '/converter/word-to-pdf',
    '/scanner',
    '/calculator',
    '/unit-converter',
    '/color-generator',
    '/stopwatch',
    '/surat-generator',
    '/surat/shared-template',
];

// Define protected paths that require authentication at a minimum
const protectedPaths = [
    '/account', // Includes /account/profile, /account/edit-profile etc.
    '/messages',
    '/notebook',
    '/wallet',
];

const adminPaths = ['/admin'];
const superAdminPaths = ['/superadmin'];

const isPathMatch = (path: string, patterns: string[]): boolean => {
    return patterns.some(pattern => {
        // Handle exact matches and directory matches (e.g., /account/)
        return path === pattern || path.startsWith(`${pattern}/`);
    });
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // Allow static files and API routes to pass through
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
        return NextResponse.next();
    }
    
    // --- Step 1: Handle Authenticated Users ---
    if (refreshToken) {
        let decoded: UserForToken;
        try {
            decoded = jwtDecode(refreshToken);
        } catch (err) {
            // Invalid refresh token, clear it and redirect to login
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('refreshToken');
            return response;
        }

        const userRole = decoded.role;

        // **Key change: Redirect authenticated users away from login page**
        if (pathname === '/login') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // --- Role-based access control for admin pages ---
        if (isPathMatch(pathname, superAdminPaths) && userRole !== 1) {
            // Redirect non-superadmins away from superadmin pages
            return NextResponse.redirect(new URL('/', request.url)); 
        }

        if (isPathMatch(pathname, adminPaths) && userRole !== 1 && userRole !== 2) {
            // Redirect non-admins away from admin pages
            return NextResponse.redirect(new URL('/', request.url));
        }
        
    } else {
        // --- Step 2: Handle Unauthenticated Users ---
        
        // Combine all protected path patterns for the check
        const allProtectedPaths = [...protectedPaths, ...adminPaths, ...superAdminPaths];

        // If the user is trying to access any protected path, redirect to login.
        if (isPathMatch(pathname, allProtectedPaths)) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // If no rules were matched, allow the request to proceed.
    return NextResponse.next();
}

export const config = {
  // This matcher ensures the middleware runs on all paths except for static assets.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sounds|icon-).*)',
  ],
}

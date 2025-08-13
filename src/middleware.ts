
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
        if (pattern.endsWith('/')) {
            return path.startsWith(pattern);
        }
        return path === pattern;
    });
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // Allow static files and API routes to pass through
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
        return NextResponse.next();
    }
    
    // Handle authenticated users
    if (refreshToken) {
        let decoded: UserForToken;
        try {
            decoded = jwtDecode(refreshToken);
        } catch (err) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('refreshToken');
            return response;
        }

        const userRole = decoded.role;

        // If a logged-in user tries to access the login page, redirect them to the home page.
        // This is a key step in preventing redirect loops.
        if (pathname === '/login') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // --- Role-based access control for admin pages ---
        if (isPathMatch(pathname, superAdminPaths) && userRole !== 1) {
            return NextResponse.redirect(new URL('/', request.url)); // Redirect non-superadmins away
        }

        if (isPathMatch(pathname, adminPaths) && userRole !== 1 && userRole !== 2) {
            return NextResponse.redirect(new URL('/', request.url)); // Redirect non-admins away
        }
        
    } else {
        // --- Handle unauthenticated users ---
        
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

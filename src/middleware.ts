
import { NextResponse, type NextRequest } from 'next/server';
import { verifyRefreshToken } from '@/lib/jwt';
import type { UserForToken } from '@/lib/jwt';

// Define paths that are considered public (no authentication required)
const publicPaths = [
    '/',
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
    '/surat/share-fallback',
    '/surat/shared-template',
];

const adminPaths = ['/admin'];
const superAdminPaths = ['/superadmin'];

const isPathPublic = (path: string): boolean => {
    // Exact match for homepage
    if (path === '/') return true;

    // Allow public access to API routes, static files, and images
    if (path.startsWith('/api/') || path.startsWith('/_next/') || path.startsWith('/images/') || path.startsWith('/sounds/') || path.endsWith('.png') || path.endsWith('.ico')) {
        return true;
    }

    // Check against defined public paths
    for (const publicPath of publicPaths) {
        if (path.startsWith(publicPath)) {
            return true;
        }
    }
    // Handle dynamic public routes like /surat/some-id
    if (path.startsWith('/surat/') && !path.startsWith('/surat-generator')) {
        return true;
    }
    return false;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    const isPublic = isPathPublic(pathname);

    // If the path is public, let them through
    if (isPublic) {
        return NextResponse.next();
    }

    // --- From this point, the route is protected ---
    
    // If no token, redirect to login page immediately
    if (!refreshToken) {
        return NextResponse.redirect(new URL('/account', request.url));
    }

    try {
        // Verify the token
        const decoded = verifyRefreshToken(refreshToken) as UserForToken;

        const isSuperAdminPath = superAdminPaths.some(p => pathname.startsWith(p));
        const isAdminPath = adminPaths.some(p => pathname.startsWith(p));
        
        // Role-based authorization checks
        if (isSuperAdminPath && decoded.role !== 1) {
            return NextResponse.redirect(new URL('/', request.url)); // Not a superadmin, redirect to home
        }

        if (isAdminPath && decoded.role !== 1 && decoded.role !== 2) {
            return NextResponse.redirect(new URL('/', request.url)); // Not an admin/superadmin, redirect to home
        }
        
        // If the user is authenticated and has the correct role, allow access
        return NextResponse.next();

    } catch (err) {
        // If token verification fails, it's invalid. Redirect to login and clear the bad cookie.
        const loginUrl = new URL('/account', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('refreshToken');
        return response;
    }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * This ensures the middleware runs on all pages and API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

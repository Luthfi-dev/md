
import { NextResponse, type NextRequest } from 'next/server';
import { verifyRefreshToken } from '@/lib/jwt';
import type { UserForToken } from '@/lib/jwt';

// Explicitly list all public routes. Any route NOT in this list is protected.
const publicPaths = [
    '/',
    '/login',
    '/account',
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
    '/surat/shared-template',
];

// Helper to check if a path is public, including dynamic public routes
const isPathPublic = (path: string): boolean => {
    // Allow access to API routes, static files, and images
    if (path.startsWith('/api/') || path.startsWith('/_next/') || path.startsWith('/images/') || path.startsWith('/sounds/') || path.endsWith('.png') || path.endsWith('.ico')) {
        return true;
    }
    // Check for exact matches or if the path starts with a public directory
    if (publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath + '/'))) {
        return true;
    }
    // Handle dynamic public routes like /surat/some-uuid
    if (path.startsWith('/surat/') && !path.startsWith('/surat-generator')) {
        return true;
    }
    return false;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // 1. If the path is public, allow access immediately.
    if (isPathPublic(pathname)) {
        return NextResponse.next();
    }

    // 2. From this point on, the route is protected. If no token, redirect to login.
    if (!refreshToken) {
        return NextResponse.redirect(new URL('/account', request.url));
    }

    try {
        // 3. Verify the token. If invalid, it will throw an error.
        const decoded = verifyRefreshToken(refreshToken) as UserForToken;

        // 4. Check role-based access for admin and superadmin panels.
        const isSuperAdminPath = pathname.startsWith('/superadmin');
        const isAdminPath = pathname.startsWith('/admin');

        if (isSuperAdminPath && decoded.role !== 1) {
            // Only role 1 can access /superadmin
            return NextResponse.redirect(new URL('/', request.url));
        }

        if (isAdminPath && decoded.role !== 1 && decoded.role !== 2) {
            // Only roles 1 and 2 can access /admin
            return NextResponse.redirect(new URL('/', request.url));
        }
        
        // 5. If token is valid and user has the correct role, allow access.
        return NextResponse.next();

    } catch (err) {
        // 6. If token verification fails, it's invalid. Redirect to login and clear the bad cookie.
        const loginUrl = new URL('/account', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('refreshToken');
        return response;
    }
}

export const config = {
  matcher: [
    // Match all paths except for static files and image optimization
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

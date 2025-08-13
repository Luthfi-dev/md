
import { NextResponse, type NextRequest } from 'next/server';
import { verifyRefreshToken } from '@/lib/jwt';
import type { UserForToken } from '@/lib/jwt';

// Explicitly list all public routes.
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
    '/surat/shared-template', // New static route for shared links
];

// Helper to check if a path is public
const isPathPublic = (path: string): boolean => {
    if (path.startsWith('/api/') || path.startsWith('/_next/') || path.startsWith('/images/') || path.startsWith('/sounds/') || path.endsWith('.png') || path.endsWith('.ico') || path.endsWith('.json')) {
        return true;
    }
    // Check for exact matches or if the path starts with a public path followed by a '/'
    if (publicPaths.some(publicPath => path === publicPath || (publicPath !== '/' && path.startsWith(publicPath + '/')))) {
        return true;
    }
     // Handle dynamic public surat links, but not the generator
    if (path.startsWith('/surat/') && !path.startsWith('/surat-generator')) {
      return !path.startsWith('/surat-generator');
    }
    return false;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    const isPublic = isPathPublic(pathname);
    const isAdminPath = pathname.startsWith('/admin');
    const isSuperAdminPath = pathname.startsWith('/superadmin');

    // If accessing a protected route without a token, redirect to login
    if (!isPublic && !refreshToken) {
        return NextResponse.redirect(new URL('/account', request.url));
    }

    if (refreshToken) {
        try {
            const decoded = verifyRefreshToken(refreshToken) as UserForToken;

            // Role-based access control for protected routes
            if (isSuperAdminPath && decoded.role !== 1) {
                return NextResponse.redirect(new URL('/', request.url));
            }

            if (isAdminPath && decoded.role !== 1 && decoded.role !== 2) {
                return NextResponse.redirect(new URL('/', request.url));
            }

        } catch (err) {
            // If token is invalid/expired and they are trying to access a protected route
            if (!isPublic) {
                const response = NextResponse.redirect(new URL('/account', request.url));
                response.cookies.delete('refreshToken');
                response.cookies.delete('accessToken'); // Also clear access token if it exists
                return response;
            }
        }
    }

    return NextResponse.next();
}

export const config = {
  // This matcher ensures the middleware runs on every request, excluding static assets.
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|sounds).*)',
};

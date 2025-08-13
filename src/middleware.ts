
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
    if (publicPaths.some(publicPath => path === publicPath || (publicPath !== '/' && path.startsWith(publicPath + '/')))) {
        return true;
    }
    // Handle dynamic public surat links, but not the generator
    if (path.startsWith('/surat/') && !path.startsWith('/surat-generator')) {
      // This logic was flawed, the share page is now static. Keeping this as an example of dynamic route handling.
      // e.g. /surat/some-uuid should be public, but it's handled by /surat/[id]/page.tsx now.
      // A better check is if it's not the generator page.
      return !path.startsWith('/surat-generator');
    }
    return false;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // If the path is public, let them pass.
    if (isPathPublic(pathname)) {
        return NextResponse.next();
    }

    // --- From this point, all routes are protected ---

    // 1. If there's no token, redirect to login immediately.
    if (!refreshToken) {
        const loginUrl = new URL('/account', request.url);
        return NextResponse.redirect(loginUrl);
    }

    try {
        // 2. Verify the token. If it's invalid or expired, it will throw an error.
        const decoded = verifyRefreshToken(refreshToken) as UserForToken;

        const isSuperAdminPath = pathname.startsWith('/superadmin');
        const isAdminPath = pathname.startsWith('/admin');

        // 3. Role-based access control.
        if (isSuperAdminPath && decoded.role !== 1) {
            // Non-superadmins trying to access /superadmin get sent to home.
            return NextResponse.redirect(new URL('/', request.url));
        }

        if (isAdminPath && decoded.role !== 1 && decoded.role !== 2) {
            // Non-admins trying to access /admin get sent to home.
            return NextResponse.redirect(new URL('/', request.url));
        }
        
        // 4. If token is valid and role is correct, allow access.
        return NextResponse.next();

    } catch (err) {
        // 5. If token verification fails, redirect to login and clear the bad cookie.
        const loginUrl = new URL('/account', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('refreshToken');
        return response;
    }
}

export const config = {
  // This matcher ensures the middleware runs on every request.
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|sounds).*)',
};

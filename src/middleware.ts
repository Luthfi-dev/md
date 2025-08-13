
import { NextResponse, type NextRequest } from 'next/server';
import { verifyRefreshToken } from '@/lib/jwt';
import type { UserForToken } from '@/lib/jwt';

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

const isPathPublic = (path: string): boolean => {
    if (path.startsWith('/api/') || path.startsWith('/_next/') || path.startsWith('/images/') || path.startsWith('/sounds/') || path.endsWith('.png') || path.endsWith('.ico') || path.endsWith('.json')) {
        return true;
    }
    if (publicPaths.some(publicPath => path === publicPath || (publicPath !== '/' && path.startsWith(publicPath + '/')))) {
        return true;
    }
    if (path.startsWith('/surat/') && !path.startsWith('/surat-generator')) {
      return true;
    }
    return false;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;
    const isPublic = isPathPublic(pathname);

    // --- Logic for users who ARE logged in ---
    if (refreshToken) {
        try {
            const decoded = verifyRefreshToken(refreshToken) as UserForToken;
            const userRole = decoded.role;

            // If a logged-in user tries to access the login page, redirect them to their dashboard
            if (pathname.startsWith('/account') || pathname.startsWith('/login')) {
                 if (userRole === 1) return NextResponse.redirect(new URL('/superadmin', request.url));
                 if (userRole === 2) return NextResponse.redirect(new URL('/admin', request.url));
                 // Regular users are redirected to the homepage
                 return NextResponse.redirect(new URL('/', request.url));
            }

            // Role-based access control for protected routes
            if (pathname.startsWith('/superadmin') && userRole !== 1) {
                return NextResponse.redirect(new URL('/', request.url));
            }
            if (pathname.startsWith('/admin') && userRole !== 1 && userRole !== 2) {
                 return NextResponse.redirect(new URL('/', request.url));
            }

        } catch (err) {
            // Invalid token. Clear it and redirect to login if accessing a protected route.
            const response = NextResponse.redirect(new URL('/account', request.url));
            response.cookies.delete('refreshToken');
            if (!isPublic) return response;
        }
    } 
    // --- Logic for users who ARE NOT logged in ---
    else {
        // If not logged in and trying to access a protected route, redirect to login
        if (!isPublic) {
            return NextResponse.redirect(new URL('/account', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|sounds).*)',
};

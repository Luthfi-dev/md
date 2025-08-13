
import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { UserForToken } from '@/lib/jwt';

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

const isPathPublic = (path: string): boolean => {
    if (path.startsWith('/api/') || path.startsWith('/_next/') || path.startsWith('/images/') || path.startsWith('/sounds/') || path.endsWith('.png') || path.endsWith('.ico') || path.endsWith('.json')) {
        return true;
    }
    if (path.startsWith('/surat/') && !path.startsWith('/surat-generator')) {
      return true;
    }
    // Match exact path or sub-paths for public routes
    return publicPaths.some(p => path === p || (p !== '/' && path.startsWith(p + '/')));
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    const isPublic = isPathPublic(pathname);

    // If user is not logged in and trying to access a protected route
    if (!refreshToken && !isPublic) {
        return NextResponse.redirect(new URL('/account', request.url));
    }

    // If user is logged in, perform role-based checks for admin routes
    if (refreshToken) {
        try {
            const decoded = jwtDecode(refreshToken) as UserForToken;
            const userRole = decoded.role;

            // If user tries to access superadmin pages
            if (pathname.startsWith('/superadmin') && userRole !== 1) {
                return NextResponse.redirect(new URL('/account/profile', request.url));
            }

            // If user tries to access admin pages
            if (pathname.startsWith('/admin') && userRole !== 1 && userRole !== 2) {
                 return NextResponse.redirect(new URL('/account/profile', request.url));
            }
            
            // If an authenticated user tries to access the login page, redirect them to the home page.
            if(pathname === '/account' || pathname === '/login') {
                return NextResponse.redirect(new URL('/', request.url));
            }

        } catch (err) {
            // Invalid token, clear it and redirect to login if accessing a protected route
            const response = isPublic 
                ? NextResponse.next() 
                : NextResponse.redirect(new URL('/account', request.url));
            
            response.cookies.delete('refreshToken');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|sounds).*)',
};


import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { UserForToken } from '@/lib/jwt';
import { getRefreshTokenName } from '@/lib/jwt';

const publicPaths = [
    '/', '/explore', '/pricing', '/converter', '/calculator', 
    '/color-generator', '/stopwatch', '/unit-converter', '/scanner', 
    '/surat', '/surat/share', '/surat/shared-template'
];

const authPaths = [
    '/account/profile', '/account/edit-profile', '/account/security', 
    '/account/notifications', '/account/settings', '/account/invite', 
    '/messages', '/notebook', '/wallet'
];

const userLoginPath = '/login';
const adminLoginPath = '/admin/login';
const superAdminLoginPath = '/superadmin/login';

const isAdminPath = (pathname: string) => pathname.startsWith('/admin');
const isSuperAdminPath = (pathname: string) => pathname.startsWith('/superadmin');

const getTokenPayload = (req: NextRequest, role: number): UserForToken | null => {
    const tokenName = getRefreshTokenName(role);
    const token = req.cookies.get(tokenName)?.value;
    if (!token) return null;
    try {
        return jwtDecode(token);
    } catch {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const superAdminToken = getTokenPayload(request, 1);
    const adminToken = getTokenPayload(request, 2);
    const userToken = getTokenPayload(request, 3);
    const hasAnyValidToken = superAdminToken || adminToken || userToken;

    // --- Super Admin Area Protection ---
    if (isSuperAdminPath(pathname)) {
        if (pathname === superAdminLoginPath) {
            if (superAdminToken) {
                return NextResponse.redirect(new URL('/superadmin', request.url));
            }
            return NextResponse.next();
        }
        if (!superAdminToken) {
            const url = new URL(superAdminLoginPath, request.url);
            url.searchParams.set('lock', '0');
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // --- Admin Area Protection ---
    if (isAdminPath(pathname)) {
        if (pathname === adminLoginPath) {
            if (adminToken || superAdminToken) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.next();
        }
        if (!adminToken && !superAdminToken) {
            const url = new URL(adminLoginPath, request.url);
            url.searchParams.set('lock', '0');
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }
    
    // --- Public & User Area Logic ---

    // Redirect logged-in users away from the main login page
    if (pathname === userLoginPath && hasAnyValidToken) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // If trying to access a protected user route without a user token, redirect to login
    if (authPaths.some(p => pathname.startsWith(p)) && !userToken) {
         const url = new URL(userLoginPath, request.url);
         url.searchParams.set('redirect', pathname);
         return NextResponse.redirect(url);
    }
    
    // Allow access to all other paths (including public ones)
    return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sounds|icon-|maskable_icon.png|.*\\.png$).*)',
  ],
};

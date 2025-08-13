
import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { UserForToken } from '@/lib/jwt';
import { getRefreshTokenName } from '@/lib/jwt';

// Define paths for different areas of the application
const publicPaths = [
    '/', '/explore', '/pricing', '/converter', '/calculator', 
    '/color-generator', '/stopwatch', '/unit-converter', '/scanner', 
    '/surat', '/surat/share', '/surat/shared-template', '/surat/share-fallback'
];

const authPaths = [
    '/account/profile', '/account/edit-profile', '/account/security', 
    '/account/notifications', '/account/settings', '/account/invite', 
    '/messages', '/notebook', '/wallet'
];

const userLoginPath = '/login';
const adminLoginPath = '/adm/login';
const superAdminLoginPath = '/spa/login';

const isAdminPath = (pathname: string) => pathname.startsWith('/adm');
const isSuperAdminPath = (pathname: string) => pathname.startsWith('/spa');

const getTokenPayload = (req: NextRequest, role: number): UserForToken | null => {
    const tokenName = getRefreshTokenName(role);
    const token = req.cookies.get(tokenName)?.value;
    if (!token) return null;
    try {
        const decoded: UserForToken = jwtDecode(token);
        // Simple validation of expiry
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            return null;
        }
        return decoded;
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
        // If trying to access login page with a valid super admin token, redirect to dashboard
        if (pathname === superAdminLoginPath && superAdminToken) {
            return NextResponse.redirect(new URL('/spa', request.url));
        }
        // If trying to access any other super admin page without a valid token, redirect to login
        if (!superAdminToken && pathname !== superAdminLoginPath) {
            return NextResponse.redirect(new URL(superAdminLoginPath, request.url));
        }
        return NextResponse.next();
    }

    // --- Admin Area Protection ---
    if (isAdminPath(pathname)) {
        const hasAdminAccess = adminToken || superAdminToken;
        if (pathname === adminLoginPath && hasAdminAccess) {
            return NextResponse.redirect(new URL('/adm', request.url));
        }
        if (!hasAdminAccess && pathname !== adminLoginPath) {
            return NextResponse.redirect(new URL(adminLoginPath, request.url));
        }
        return NextResponse.next();
    }
    
    // --- Public & User Area Logic ---

    // Redirect logged-in users away from the main login page
    if (pathname === userLoginPath && userToken) {
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

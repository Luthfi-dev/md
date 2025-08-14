
import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { UserForToken } from '@/lib/jwt';
import { getRefreshTokenName } from '@/lib/jwt';

// Define paths for different areas of the application
const publicPaths = [
    '/', '/explore', '/pricing', '/converter', '/calculator', 
    '/color-generator', '/stopwatch', '/unit-converter', '/scanner', 
    '/surat', '/surat/share', '/surat/shared-template', '/surat-generator',
    '/converter/image-to-pdf', '/converter/pdf-to-word', '/converter/word-to-pdf',
    '/account/forgot-password', '/account/reset-password' // Moved from authPaths
];

const userLoginPath = '/login';
const authPaths = [
    '/account/profile', '/account/edit-profile', '/account/security', 
    '/account/notifications', '/account/settings', '/account/invite', 
    '/messages', '/notebook', '/wallet', '/notebook/groups',
];

const admLoginPath = '/adm/login';
const isAdmPath = (pathname: string) => pathname.startsWith('/adm');

const spaLoginPath = '/spa/login';
const isSpaPath = (pathname: string) => pathname.startsWith('/spa');

const getTokenPayload = (req: NextRequest, role: number): UserForToken | null => {
    const tokenName = getRefreshTokenName(role);
    const token = req.cookies.get(tokenName)?.value;
    if (!token) return null;
    try {
        const decoded: UserForToken = jwtDecode(token);
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
    
    // --- Super Admin Area Protection ---
    if (isSpaPath(pathname)) {
        if (!superAdminToken && pathname !== spaLoginPath) {
            const url = new URL(spaLoginPath, request.url);
            return NextResponse.redirect(url);
        }
        if (superAdminToken && pathname === spaLoginPath) {
            return NextResponse.redirect(new URL('/spa', request.url));
        }
        return NextResponse.next();
    }

    // --- Admin Area Protection ---
    if (isAdmPath(pathname)) {
        const hasAdminAccess = adminToken || superAdminToken;
        if (!hasAdminAccess && pathname !== admLoginPath) {
             const url = new URL(admLoginPath, request.url);
            return NextResponse.redirect(url);
        }
        if (hasAdminAccess && pathname === admLoginPath) {
            return NextResponse.redirect(new URL('/adm', request.url));
        }
        return NextResponse.next();
    }
    
    // Allow public paths to be accessed by anyone
    if (publicPaths.some(p => pathname === p || (p !== '/' && pathname.startsWith(p+'/')))) {
        return NextResponse.next();
    }
    
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
    
    // Default case: allow access to all other paths (including root)
    return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sounds|icon-|maskable_icon.png|.*\\.png$).*)',
  ],
};

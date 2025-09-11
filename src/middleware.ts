
import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { UserForToken } from '@/lib/jwt';
import { getRefreshTokenName } from '@/lib/jwt';

// Define paths for different areas of the application
const publicPaths = [
    '/', '/explore', '/pricing', '/converter', '/calculator', 
    '/color-generator', '/stopwatch', '/unit-converter', '/scanner', 
    '/surat', '/surat/share-fallback', '/surat/shared-template', '/surat-generator',
    '/converter/image-to-pdf', '/converter/pdf-to-word', '/converter/word-to-pdf',
    '/account/forgot-password', '/account/reset-password',
    '/blog', '/messages', '/project-calculator', '/install' 
];

const userLoginPath = '/login';
const authPaths = [
    '/account', '/notebook', '/wallet', '/project-calculator/list', '/content-creator', '/recommender', '/tts'
];

const adminLoginPath = '/admin/login';
const isAdminPath = (pathname: string) => pathname.startsWith('/admin');

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
            return NextResponse.redirect(new URL(spaLoginPath, request.url));
        }
        if (superAdminToken && pathname === spaLoginPath) {
            return NextResponse.redirect(new URL('/spa', request.url));
        }
        return NextResponse.next();
    }

    // --- Admin Area Protection ---
    if (isAdminPath(pathname)) {
        const hasAdminAccess = adminToken || superAdminToken;
        if (!hasAdminAccess && pathname !== adminLoginPath) {
            return NextResponse.redirect(new URL(adminLoginPath, request.url));
        }
        if (hasAdminAccess && pathname === adminLoginPath) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.next();
    }
    
    // --- Public Paths ---
    const isPublic = publicPaths.some(p => pathname.startsWith(p) && (pathname.length === p.length || pathname[p.length] === '/'));
    if (isPublic) {
        return NextResponse.next();
    }
    
    // --- User Area Protection ---
    
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
    
    // Default case: allow access if no other rule has matched.
    return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for specific static assets and API routes.
    // This list must exclude the service worker, manifest, and all icon files to ensure PWA works correctly.
    '/((?!api|_next/static|_next/image|sw.js|manifest.webmanifest|favicon.ico|sounds/|icons/|.*\\..*).*)'
  ],
};

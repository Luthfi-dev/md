
import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { UserForToken } from '@/lib/jwt';
import { getRefreshTokenName } from '@/lib/jwt';

const publicPaths = [
    '/',
    '/explore',
    '/pricing',
    '/converter',
    '/calculator',
    '/color-generator',
    '/stopwatch',
    '/unit-converter',
    '/scanner',
    '/surat',
    '/surat/share-fallback',
    '/surat/shared-template',
];

const authPaths = [
    '/account/profile',
    '/account/edit-profile',
    '/account/security',
    '/account/notifications',
    '/account/settings',
    '/account/invite',
    '/messages',
    '/notebook',
    '/wallet'
];

const adminPaths = ['/admin'];
const superAdminPaths = ['/superadmin'];
const userLoginPath = '/login';
const adminLoginPath = '/admin/login';
const superAdminLoginPath = '/superadmin/login';

const isPathMatch = (pathname: string, paths: string[]) => {
    return paths.some(path => pathname.startsWith(path));
}

const getRoleFromToken = (req: NextRequest, role: number): UserForToken | null => {
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

    // Allow all public paths
    if (isPathMatch(pathname, publicPaths)) {
        return NextResponse.next();
    }
    
    const userToken = getRoleFromToken(request, 3);
    const adminToken = getRoleFromToken(request, 2);
    const superAdminToken = getRoleFromToken(request, 1);

    // --- Super Admin Area ---
    if (isPathMatch(pathname, superAdminPaths)) {
        if (!superAdminToken) return NextResponse.redirect(new URL(superAdminLoginPath, request.url));
        if (superAdminToken.role !== 1) return NextResponse.redirect(new URL(superAdminLoginPath, request.url));
        return NextResponse.next();
    }

    // --- Admin Area ---
    if (isPathMatch(pathname, adminPaths)) {
        if (!adminToken && !superAdminToken) return NextResponse.redirect(new URL(adminLoginPath, request.url));
        if (adminToken?.role !== 2 && superAdminToken?.role !== 1) return NextResponse.redirect(new URL(adminLoginPath, request.url));
        return NextResponse.next();
    }
    
    // --- User Auth Area ---
    if (isPathMatch(pathname, authPaths)) {
         if (!userToken) return NextResponse.redirect(new URL(userLoginPath, request.url));
         return NextResponse.next();
    }

    // --- Login Pages ---
    if (pathname === userLoginPath && userToken) {
        return NextResponse.redirect(new URL('/account/profile', request.url));
    }
    if (pathname === adminLoginPath && (adminToken || superAdminToken)) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (pathname === superAdminLoginPath && superAdminToken) {
        return NextResponse.redirect(new URL('/superadmin', request.url));
    }

    return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sounds|icon-|maskable_icon.png|.*\\.png$).*)',
  ],
};

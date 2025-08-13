
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

const userLoginPath = '/login';
const adminLoginPath = '/admin/login';
const superAdminLoginPath = '/superadmin/login';

const isPathMatch = (pathname: string, paths: string[]) => {
    return paths.some(path => pathname.startsWith(path));
}

const getTokenPayload = (req: NextRequest, role: number): UserForToken | null => {
    const tokenName = getRefreshTokenName(role);
    const token = req.cookies.get(tokenName)?.value;
    if (!token) return null;
    try {
        return jwtDecode(token);
    } catch {
        // Clear invalid token
        const res = NextResponse.next();
        res.cookies.delete(tokenName);
        return null;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    const superAdminToken = getTokenPayload(request, 1);
    const adminToken = getTokenPayload(request, 2);
    const userToken = getTokenPayload(request, 3);
    
    // --- Super Admin Area Protection ---
    if (pathname.startsWith('/superadmin')) {
        if (pathname.startsWith(superAdminLoginPath)) {
            // If already logged in as superadmin, redirect to dashboard
            if (superAdminToken) {
                 return NextResponse.redirect(new URL('/superadmin', request.url));
            }
            return NextResponse.next();
        }
        // For any other /superadmin page, require a valid superadmin token
        if (!superAdminToken) {
            return NextResponse.redirect(new URL(superAdminLoginPath, request.url));
        }
        return NextResponse.next();
    }
    
    // --- Admin Area Protection ---
    if (pathname.startsWith('/admin')) {
         if (pathname.startsWith(adminLoginPath)) {
            // If already logged in as admin or superadmin, redirect to dashboard
            if (adminToken || superAdminToken) {
                 return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.next();
        }
        // For any other /admin page, require a valid admin or superadmin token
        if (!adminToken && !superAdminToken) {
             return NextResponse.redirect(new URL(adminLoginPath, request.url));
        }
        return NextResponse.next();
    }
    
    // --- User Login Page Protection ---
    if (pathname.startsWith(userLoginPath)) {
        // If any user is already logged in, redirect them away from the login page
        if (userToken || adminToken || superAdminToken) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // --- General Authenticated User Area Protection ---
    if (isPathMatch(pathname, authPaths)) {
        if (!userToken) {
            // Append redirect URL so user can be sent back after login
            const url = new URL(userLoginPath, request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }
    
    // For all other paths, including public ones, allow access.
    return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sounds|icon-|maskable_icon.png|.*\\.png$).*)',
  ],
};

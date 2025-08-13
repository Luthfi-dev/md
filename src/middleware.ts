
import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { UserForToken } from '@/lib/jwt';

// --- Konfigurasi Rute ---
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
    '/account',
    '/messages',
    '/notebook',
    '/wallet'
];

const loginPaths = ['/login', '/account/forgot-password', '/account/reset-password'];

const adminLoginPath = '/admin/login';
const superadminLoginPath = '/superadmin/login';

// --- Helper ---
const isPathMatch = (pathname: string, paths: string[]) => {
    return paths.some(path => pathname.startsWith(path));
}

// --- Middleware ---
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // --- Cek Rute Publik ---
    if (isPathMatch(pathname, publicPaths) || isPathMatch(pathname, loginPaths) || pathname === adminLoginPath || pathname === superadminLoginPath) {
        // Jika sudah login dan mencoba akses halaman login, arahkan
        if (refreshToken) {
            if (isPathMatch(pathname, loginPaths)) return NextResponse.redirect(new URL('/', request.url));
            if (pathname === adminLoginPath) return NextResponse.redirect(new URL('/admin', request.url));
            if (pathname === superadminLoginPath) return NextResponse.redirect(new URL('/superadmin', request.url));
        }
        return NextResponse.next();
    }

    // --- Cek Rute Terproteksi ---
    if (!refreshToken) {
        let loginUrl = new URL('/login', request.url);
        if (pathname.startsWith('/admin')) loginUrl = new URL(adminLoginPath, request.url);
        if (pathname.startsWith('/superadmin')) loginUrl = new URL(superadminLoginPath, request.url);
        
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // --- Cek Otorisasi Berbasis Peran ---
    try {
        const decoded: UserForToken = jwtDecode(refreshToken);
        const userRole = decoded.role;

        if (pathname.startsWith('/superadmin') && userRole !== 1) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        if (pathname.startsWith('/admin') && userRole !== 1 && userRole !== 2) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Jika user biasa mencoba akses area admin/superadmin, arahkan ke profil mereka
        if ((pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) && userRole === 3) {
             return NextResponse.redirect(new URL('/account/profile', request.url));
        }

    } catch (err) {
        // Token tidak valid, hapus dan arahkan ke login yang sesuai
        let loginUrl = new URL('/login', request.url);
        if (pathname.startsWith('/admin')) loginUrl = new URL(adminLoginPath, request.url);
        if (pathname.startsWith('/superadmin')) loginUrl = new URL(superadminLoginPath, request.url);

        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('refreshToken');
        return response;
    }

    // Jika semua pemeriksaan lolos, izinkan permintaan
    return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sounds|icon-|maskable_icon.png).*)',
  ],
};

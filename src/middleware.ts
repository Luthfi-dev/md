
import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import type { UserForToken } from '@/lib/jwt';

// --- Konfigurasi Rute ---

// Rute yang dapat diakses oleh siapa saja, bahkan yang belum login.
const publicPaths = [
    '/',
    '/login',
    '/account/forgot-password',
    '/account/reset-password',
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
];

// Rute yang memerlukan pengguna untuk login, terlepas dari perannya.
const authenticatedPaths = [
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

// --- Middleware ---

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // 1. Cek apakah rute saat ini adalah rute publik
    const isPublicPath = publicPaths.some(path => {
        if (path.endsWith('/')) return pathname === path;
        return pathname.startsWith(path);
    });

    if (isPublicPath) {
        // Jika pengguna sudah login dan mencoba mengakses /login, arahkan ke halaman utama
        if (refreshToken && pathname.startsWith('/login')) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        // Izinkan akses ke semua rute publik lainnya
        return NextResponse.next();
    }
    
    // 2. Jika bukan rute publik, pengguna harus login
    if (!refreshToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname); // Opsional: simpan rute tujuan
        return NextResponse.redirect(loginUrl);
    }
    
    // 3. Jika pengguna sudah login, periksa otorisasi berbasis peran untuk rute admin
    try {
        const decoded: UserForToken = jwtDecode(refreshToken);
        const userRole = decoded.role;

        if (pathname.startsWith('/superadmin') && userRole !== 1) {
            return NextResponse.redirect(new URL('/', request.url)); // Arahkan ke beranda
        }

        if (pathname.startsWith('/admin') && userRole !== 1 && userRole !== 2) {
            return NextResponse.redirect(new URL('/', request.url)); // Arahkan ke beranda
        }

    } catch (err) {
        // Token tidak valid, hapus dan arahkan ke login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('refreshToken');
        return response;
    }

    // Jika semua pemeriksaan lolos, izinkan permintaan
    return NextResponse.next();
}

export const config = {
  // Jalankan middleware di semua rute kecuali untuk file statis dan internal Next.js
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sounds|icon-|maskable_icon.png).*)',
  ],
};

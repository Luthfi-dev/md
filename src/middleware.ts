
import { NextResponse, type NextRequest } from 'next/server';
import { verifyRefreshToken } from '@/lib/jwt';
import type { UserForToken } from '@/lib/jwt';

// Define paths that are considered public (no authentication required)
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
    '/surat/share',
    '/surat/shared-template',
];

const adminPaths = ['/admin', '/superadmin'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // Check if the path is for static files, API routes, or images, and skip middleware
    const isStaticAsset = pathname.startsWith('/_next') || 
                          pathname.startsWith('/api') || 
                          pathname.startsWith('/images') || 
                          pathname.startsWith('/sounds') ||
                          pathname.includes('icon-') ||
                          pathname.includes('favicon.ico') ||
                          pathname.includes('.png');

    if (isStaticAsset) {
        return NextResponse.next();
    }
    
    // Allow access to public paths
    const isPublic = publicPaths.some(p => pathname.startsWith(p) && p.length > 1) || pathname === '/';
    if(isPublic) {
        // Exception: If user is already logged in and tries to access /account, redirect them away.
        // This is handled client-side in useAuth now to prevent redirect loops.
        return NextResponse.next();
    }
    
    // For protected paths (including admin), a refresh token is required.
    if (!refreshToken) {
        const loginUrl = new URL('/account', request.url)
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const decoded = verifyRefreshToken(refreshToken) as UserForToken;
        
        const isSuperAdminPath = pathname.startsWith('/superadmin');
        const isAdminPath = pathname.startsWith('/admin');

        // Role-based access control for admin paths
        if (isSuperAdminPath && decoded.role !== 1) {
            return NextResponse.redirect(new URL('/', request.url)); // Redirect non-superadmins from superadmin page
        }
        if (isAdminPath && !isSuperAdminPath && decoded.role !== 1 && decoded.role !== 2) {
             return NextResponse.redirect(new URL('/', request.url)); // Redirect non-admins from admin page
        }
        
    } catch (err) {
        // Invalid refresh token, clear it and redirect to login
        const loginUrl = new URL('/account', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('refreshToken');
        return response;
    }

    return NextResponse.next();
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     * - sounds/ (public sounds)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images/|sounds/).*)',
  ],
}

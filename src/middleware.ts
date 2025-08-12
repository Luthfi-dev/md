
import { NextResponse, type NextRequest } from 'next/server';
import { verifyRefreshToken } from '@/lib/jwt';
import type { UserForToken } from '@/lib/jwt';

// Define paths that are considered public (no authentication required)
const publicPaths = [
    '/',
    '/login',
    '/account',
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
    
    // Allow access to public paths even without a refresh token
    const isPublic = publicPaths.some(p => pathname.startsWith(p)) || pathname === '/';
    if(isPublic) {
        return NextResponse.next();
    }

    // For all other (protected) paths, check for a valid refresh token.
    if (!refreshToken) {
        return NextResponse.redirect(new URL('/account', request.url));
    }

    try {
        const decoded = verifyRefreshToken(refreshToken) as UserForToken;
        
        // If the user is authenticated, check for role-based access to admin paths
        if (pathname.startsWith('/superadmin') && decoded.role !== 1) {
            return NextResponse.redirect(new URL('/account', request.url));
        }
        if (pathname.startsWith('/admin') && decoded.role !== 1 && decoded.role !== 2) {
            return NextResponse.redirect(new URL('/account', request.url));
        }
        
    } catch (err) {
        // Invalid refresh token, clear it and redirect to login
        const response = NextResponse.redirect(new URL('/account', request.url));
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

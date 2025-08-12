
import { NextResponse, type NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
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
    // Add other public paths here
];

const adminPaths = ['/admin', '/superadmin'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // Check if the path is for static files, API routes, or images, and skip middleware
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/images') ||
        pathname.startsWith('/sounds') ||
        publicPaths.some(p => pathname.startsWith(p) && p !== '/') ||
        pathname === '/'
    ) {
        return NextResponse.next();
    }

    // If there's no refresh token, redirect to login for any protected route
    if (!refreshToken) {
        return NextResponse.redirect(new URL('/account', request.url));
    }
    
    // For protected routes, try to verify the access token
    if (accessToken) {
        const decoded = verifyAccessToken(accessToken) as UserForToken | null;
        
        if (decoded) {
            // User is authenticated
            const userRole = decoded.role;
            
            // If trying to access admin paths without the right role, redirect
            if (pathname.startsWith('/superadmin') && userRole !== 1) {
                 return NextResponse.redirect(new URL('/account', request.url));
            }
            if (pathname.startsWith('/admin') && userRole !== 1 && userRole !== 2) {
                 return NextResponse.redirect(new URL('/account', request.url));
            }
            
            return NextResponse.next();
        }
    }

    // If access token is missing or expired, but refresh token exists,
    // let the client-side handle the silent refresh.
    // For server-side rendering, you might want to redirect to a loading page
    // or perform the refresh here. For this SPA-like app, we let the client do it.
    // However, for direct navigation to protected pages, a redirect is better.
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

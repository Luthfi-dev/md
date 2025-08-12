
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
    '/surat/share-fallback',
    '/surat/shared-template',
];

const adminPaths = ['/admin'];
const superAdminPaths = ['/superadmin'];

const isPathPublic = (path: string): boolean => {
    if (path === '/') return true;
    for (const publicPath of publicPaths) {
        if (path.startsWith(publicPath)) {
            return true;
        }
    }
    // Handle dynamic public routes like /surat/some-id
    if (path.startsWith('/surat/') && !path.startsWith('/surat-generator')) {
        return true;
    }
    return false;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    const isApiOrStatic = pathname.startsWith('/api/') || 
                          pathname.startsWith('/_next/') || 
                          pathname.startsWith('/images/') ||
                          pathname.startsWith('/sounds/') ||
                          pathname.endsWith('.png') ||
                          pathname.endsWith('.ico');
    
    if (isApiOrStatic) {
        return NextResponse.next();
    }

    const isPublic = isPathPublic(pathname);

    // If user is trying to access a public path, let them through
    if (isPublic) {
        return NextResponse.next();
    }

    // --- Protected Routes Logic ---
    // From here on, all routes require a valid token.
    if (!refreshToken) {
        return NextResponse.redirect(new URL('/account', request.url));
    }

    try {
        const decoded = verifyRefreshToken(refreshToken) as UserForToken;

        const isSuperAdminPath = superAdminPaths.some(p => pathname.startsWith(p));
        const isAdminPath = adminPaths.some(p => pathname.startsWith(p));
        
        // If it's a superadmin path, user MUST have role 1
        if (isSuperAdminPath && decoded.role !== 1) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // If it's an admin path (but not superadmin), user MUST have role 1 or 2
        if (isAdminPath && !isSuperAdminPath && decoded.role !== 1 && decoded.role !== 2) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        
        // User has a valid token and the correct role (or it's a general protected path), allow access.
        return NextResponse.next();

    } catch (err) {
        // Invalid token
        const loginUrl = new URL('/account', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('refreshToken');
        return response;
    }
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

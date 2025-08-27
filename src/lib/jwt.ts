
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type NextResponse } from 'next/server';
import { serialize } from 'cookie';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_super_secret_access_key';
const REFRESH_TOKEN_SECRET_USER = process.env.REFRESH_TOKEN_SECRET_USER || 'your_super_secret_refresh_key_user';
const REFRESH_TOKEN_SECRET_ADMIN = process.env.REFRESH_TOKEN_SECRET_ADMIN || 'your_super_secret_refresh_key_admin';
const REFRESH_TOKEN_SECRET_SUPERADMIN = process.env.REFRESH_TOKEN_SECRET_SUPERADMIN || 'your_super_secret_refresh_key_superadmin';

const ACCESS_TOKEN_EXPIRATION = '7d'; // Changed from '15m' to 7 days

export interface UserForToken {
    id: number;
    name: string;
    email: string;
    role: number;
    avatar?: string;
    phone?: string;
    points?: number;
    referralCode?: string;
}

export function getRefreshTokenName(role: number): string {
    switch (role) {
        case 1: return 'superAdminRefreshToken';
        case 2: return 'adminRefreshToken';
        default: return 'refreshToken';
    }
}

function getRefreshTokenSecret(role: number): string {
     switch (role) {
        case 1: return REFRESH_TOKEN_SECRET_SUPERADMIN;
        case 2: return REFRESH_TOKEN_SECRET_ADMIN;
        default: return REFRESH_TOKEN_SECRET_USER;
    }
}

function getRefreshTokenExpiration(role: number): string {
    switch (role) {
        case 1: // Super Admin
        case 2: // Admin
            return '6h'; // Admin sessions are shorter for security
        case 3: // User
        default:
            return '180d'; // Changed from '30d' to 180 days (6 months)
    }
}


export function generateTokens(payload: UserForToken) {
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
    
    const refreshTokenSecret = getRefreshTokenSecret(payload.role);
    const refreshTokenExpiration = getRefreshTokenExpiration(payload.role);
    
    const refreshToken = jwt.sign(payload, refreshTokenSecret, { expiresIn: refreshTokenExpiration });

    return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
    } catch (e) {
        return null;
    }
}

export function verifyRefreshToken(token: string, role: number): JwtPayload | null {
    const secret = getRefreshTokenSecret(role);
     try {
        return jwt.verify(token, secret) as JwtPayload;
    } catch (e) {
        return null;
    }
}

export function setTokenCookie(res: NextResponse, role: number, refreshToken: string) {
    const cookieName = getRefreshTokenName(role);
    let expirationInSeconds;

    switch (role) {
        case 1: // Super Admin
        case 2: // Admin
            expirationInSeconds = 6 * 60 * 60; // 6 hours
            break;
        case 3: // User
        default:
            expirationInSeconds = 180 * 24 * 60 * 60; // 180 days
            break;
    }

    const cookie = serialize(cookieName, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: expirationInSeconds
    });
    res.headers.append('Set-Cookie', cookie);
}

export function clearTokenCookie(res: NextResponse, role: number) {
    const cookieName = getRefreshTokenName(role);
    const cookie = serialize(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: new Date(0),
    });
    res.headers.append('Set-Cookie', cookie);
}

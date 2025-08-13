
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type NextResponse } from 'next/server';
import { serialize } from 'cookie';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_super_secret_access_key';
const REFRESH_TOKEN_SECRET_USER = process.env.REFRESH_TOKEN_SECRET_USER || 'your_super_secret_refresh_key_user';
const REFRESH_TOKEN_SECRET_ADMIN = process.env.REFRESH_TOKEN_SECRET_ADMIN || 'your_super_secret_refresh_key_admin';
const REFRESH_TOKEN_SECRET_SUPERADMIN = process.env.REFRESH_TOKEN_SECRET_SUPERADMIN || 'your_super_secret_refresh_key_superadmin';

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '30d';

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

export function generateTokens(payload: UserForToken) {
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
    const refreshTokenSecret = getRefreshTokenSecret(payload.role);
    const refreshToken = jwt.sign(payload, refreshTokenSecret, { expiresIn: REFRESH_TOKEN_EXPIRATION });
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
    const cookie = serialize(cookieName, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
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

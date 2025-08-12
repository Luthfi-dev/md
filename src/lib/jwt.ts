
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type NextResponse } from 'next/server';
import { serialize } from 'cookie';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_super_secret_access_key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_super_secret_refresh_key';

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '30d'; // Extended to 30 days

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

export function generateTokens(payload: UserForToken) {
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });
    return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string) {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (e) {
        return null;
    }
}

export function verifyRefreshToken(token: string) {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

export function setTokenCookie(res: NextResponse, refreshToken: string) {
    const cookie = serialize('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
    });
    res.headers.set('Set-Cookie', cookie);
}

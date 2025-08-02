
import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  // Clear the refresh token cookie
  const cookie = serialize('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0), // Set expiry date to the past
  });

  const response = NextResponse.json({ success: true, message: 'Logout berhasil' });
  response.headers.set('Set-Cookie', cookie);
  return response;
}

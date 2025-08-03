
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken, generateTokens, setTokenCookie } from '@/lib/jwt';
import type { UserForToken } from '@/lib/jwt';

export async function POST() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json({ success: false, message: 'Refresh token tidak ditemukan.' }, { status: 401 });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken) as UserForToken;
    
    // The user data is inside the token, no need to query DB again unless we need to re-validate user status
    const userForToken: UserForToken = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
    };
    
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(userForToken);

    const response = NextResponse.json({
        success: true,
        accessToken,
    });
    
    setTokenCookie(response, newRefreshToken);
    
    return response;

  } catch (error) {
    console.error('Refresh token error:', error);
    // Clear the invalid cookie
    const response = NextResponse.json({ success: false, message: 'Sesi tidak valid, silakan login kembali.' }, { status: 401 });
    response.cookies.set('refreshToken', '', { expires: new Date(0), path: '/' });
    return response;
  }
}

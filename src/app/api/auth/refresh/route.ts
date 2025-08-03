
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken, generateTokens, setTokenCookie } from '@/lib/jwt';
import type { UserForToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

export async function POST() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json({ success: false, message: 'Refresh token tidak ditemukan.' }, { status: 401 });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken) as UserForToken;
    
    // Re-fetch user from DB to get the latest data, including encrypted points
    const connection = await db.getConnection();
    const [rows]: [any[], any] = await connection.execute(
      'SELECT id, name, email, role_id, avatar_url, phone_number, points, referral_code FROM users WHERE id = ?',
      [decoded.id]
    );
    connection.release();

    if (rows.length === 0) {
      throw new Error('User not found during token refresh.');
    }
    const userDb = rows[0];

    // Decrypt sensitive data before creating the new token payload
    const decryptedPhone = userDb.phone_number ? decrypt(userDb.phone_number) : undefined;
    const decryptedPoints = userDb.points ? parseInt(decrypt(userDb.points), 10) : 0;

    const userForToken: UserForToken = {
        id: userDb.id,
        name: userDb.name,
        email: userDb.email,
        role: userDb.role_id,
        avatar: userDb.avatar_url,
        phone: decryptedPhone,
        points: decryptedPoints,
        referralCode: userDb.referral_code
    };
    
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(userForToken);

    const response = NextResponse.json({
        success: true,
        accessToken,
        user: userForToken, // Send back updated user data
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

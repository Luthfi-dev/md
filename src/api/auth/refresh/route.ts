
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken, generateTokens, setTokenCookie, getRefreshTokenName } from '@/lib/jwt';
import type { UserForToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

// This function attempts to refresh a token for a given role
async function tryRefreshForRole(role: number, request: NextRequest) {
    const cookieName = getRefreshTokenName(role);
    const refreshToken = request.cookies.get(cookieName)?.value;

    if (!refreshToken) {
        return null;
    }

    const decoded = verifyRefreshToken(refreshToken, role) as UserForToken;
    if (!decoded) {
        return null;
    }

    // Re-fetch user from DB to get the latest data
    let connection = await db.getConnection();
    try {
        const [rows]: [any[], any] = await connection.execute(
            'SELECT id, name, email, role_id, avatar_url, phone_number, points, referral_code FROM users WHERE id = ?',
            [decoded.id]
        );
        if (rows.length === 0) throw new Error('User not found');
        
        const userDb = rows[0];
        const decryptedPhone = userDb.phone_number ? decrypt(userDb.phone_number) : undefined;
        const decryptedPoints = userDb.points ? parseInt(decrypt(userDb.points), 10) : 0;
        
        const userForToken: UserForToken = {
            id: userDb.id, name: userDb.name, email: userDb.email, role: userDb.role_id,
            avatar: userDb.avatar_url, phone: decryptedPhone, points: decryptedPoints,
            referralCode: userDb.referral_code
        };

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(userForToken);
        const response = NextResponse.json({ success: true, accessToken, user: userForToken });
        setTokenCookie(response, userForToken.role, newRefreshToken);
        return response;
    } finally {
        if (connection) connection.release();
    }
}

export async function POST(request: NextRequest) {
  // Try refreshing for each role, starting from the most privileged
  const rolesToTry = [1, 2, 3]; 

  for (const role of rolesToTry) {
      try {
          const response = await tryRefreshForRole(role, request);
          if (response) {
              return response;
          }
      } catch (error) {
          // Token for this role was invalid, clear it and try the next
          const cookieName = getRefreshTokenName(role);
          const response = NextResponse.next();
          response.cookies.delete(cookieName);
          console.warn(`Cleared invalid refresh token for role ${role}`);
      }
  }

  // If no token could be refreshed
  return NextResponse.json({ success: false, message: 'Sesi tidak valid atau telah kedaluwarsa.' }, { status: 401 });
}


import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken, generateTokens, setTokenCookie, getRefreshTokenName } from '@/lib/jwt';
import type { UserForToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

// This function attempts to refresh a token for a given role
async function tryRefreshForRole(request: NextRequest, role: number): Promise<NextResponse | null> {
    const cookieName = getRefreshTokenName(role);
    const refreshToken = request.cookies.get(cookieName)?.value;

    if (!refreshToken) {
        return null;
    }

    try {
        const decoded = verifyRefreshToken(refreshToken, role);
        if (!decoded) {
            // If token is invalid for this role, clear it and return null
            const response = NextResponse.json({ success: false, message: 'Sesi tidak valid.' }, { status: 401 });
            response.cookies.delete(cookieName);
            return response;
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
            // Ensure the role from the DB matches the token's role
            if (userDb.role_id !== role) {
                // This is a security measure against role mismatch
                 throw new Error('Role mismatch during token refresh.');
            }

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
    } catch(error) {
        // This catch block handles errors like JWT verification failure or DB connection issues for a specific role's token
        console.warn(`Failed to refresh token for role ${role}:`, error);
        const response = NextResponse.json({ success: false, message: 'Sesi tidak valid atau telah kedaluwarsa.' }, { status: 401 });
        response.cookies.delete(cookieName);
        return response;
    }
}

export async function POST(request: NextRequest) {
  // Try refreshing for each role, starting from the most privileged
  // The order matters if a user could somehow have multiple tokens.
  const rolesToTry = [1, 2, 3]; 

  for (const role of rolesToTry) {
      const response = await tryRefreshForRole(request, role);
      // If we get a successful response (status 200), return it immediately.
      if (response && response.status === 200) {
          return response;
      }
  }

  // If no token could be successfully refreshed across all roles
  return NextResponse.json({ success: false, message: 'Sesi tidak valid atau telah kedaluwarsa.' }, { status: 401 });
}

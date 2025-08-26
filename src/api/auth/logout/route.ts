
import { NextResponse, type NextRequest } from 'next/server';
import { clearTokenCookie } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logout berhasil' });
  
  // Clear all possible tokens for a full logout, ensuring no session residue.
  clearTokenCookie(response, 1); // Super Admin
  clearTokenCookie(response, 2); // Admin
  clearTokenCookie(response, 3); // User

  return response;
}

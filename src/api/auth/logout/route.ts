
import { NextResponse, type NextRequest } from 'next/server';
import { clearTokenCookie } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  const { role } = await request.json();
  const userRole = role || 3; // Default to user role if not provided

  const response = NextResponse.json({ success: true, message: 'Logout berhasil' });
  
  // Clear all possible tokens for a full logout
  clearTokenCookie(response, 1);
  clearTokenCookie(response, 2);
  clearTokenCookie(response, 3);

  return response;
}

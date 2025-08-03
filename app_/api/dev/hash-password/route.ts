
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth-utils';

/**
 * A development-only endpoint to hash a password.
 * NEVER expose this in production.
 * 
 * Usage:
 * POST /api/dev/hash-password
 * Body: { "password": "your_password_to_hash" }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'This endpoint is only available in development.' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required and must be a string.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    return NextResponse.json({
      originalPassword: password,
      hashedPassword: hashedPassword,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
}

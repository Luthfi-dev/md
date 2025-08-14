
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendEmail } from '@/services/EmailManager';
import { hash } from 'bcryptjs';

const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid."),
});

// Using a more secure hashing algorithm for the token
async function hashToken(token: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    return Buffer.from(digest).toString('hex');
}


export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }
    const { email } = validation.data;

    connection = await db.getConnection();
    const [users]: [RowDataPacket[], any] = await connection.execute(
      'SELECT id, name FROM users WHERE email = ?',
      [email]
    );

    // Always return a success-like message to prevent user enumeration attacks
    if (users.length === 0) {
      console.log(`Password reset attempt for non-existent email: ${email}`);
      return NextResponse.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim.' });
    }
    const user = users[0];

    // Generate a secure token
    const token = randomBytes(32).toString('hex');
    const hashedToken = await hashToken(token);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

    await connection.execute<ResultSetHeader>(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, hashedToken, expiresAt]
    );

    const resetLink = `${request.nextUrl.origin}/account/reset-password?token=${token}`;
    
    await sendEmail({
        to: email,
        subject: 'Atur Ulang Kata Sandi Akun Anda',
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Reset Kata Sandi</h2>
                <p>Halo ${user.name},</p>
                <p>Anda menerima email ini karena ada permintaan untuk mereset kata sandi akun Anda. Jika Anda tidak merasa meminta ini, abaikan saja email ini.</p>
                <p>Klik tombol di bawah ini untuk mengatur ulang kata sandi Anda:</p>
                <p style="margin: 20px 0;">
                  <a href="${resetLink}" style="background-color: #1D88FE; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Atur Ulang Kata Sandi</a>
                </p>
                <p>Link ini akan kedaluwarsa dalam 1 jam.</p>
                <p>Terima kasih,<br>Tim Aplikasi</p>
               </div>`,
    });

    return NextResponse.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim.' });

  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    // Do not expose detailed errors to the client
    return NextResponse.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim.' });
  } finally {
    if (connection) connection.release();
  }
}

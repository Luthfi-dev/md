
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendEmail } from '@/services/EmailManager';

const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid."),
});

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
      'SELECT id FROM users WHERE email = ?',
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
    const hashedToken = randomBytes(32).toString('hex'); // In a real app, hash this token before storing
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

    await connection.execute<ResultSetHeader>(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, hashedToken, expiresAt]
    );

    const resetLink = `${request.nextUrl.origin}/account/reset-password?token=${token}`;
    
    await sendEmail({
        to: email,
        subject: 'Reset Kata Sandi Anda',
        html: `<p>Anda menerima email ini karena ada permintaan untuk mereset kata sandi akun Anda.</p>
               <p>Klik link di bawah ini untuk mengatur ulang kata sandi Anda:</p>
               <a href="${resetLink}">Reset Kata Sandi</a>
               <p>Link ini akan kedaluwarsa dalam 1 jam. Jika Anda tidak merasa meminta ini, abaikan saja email ini.</p>`,
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

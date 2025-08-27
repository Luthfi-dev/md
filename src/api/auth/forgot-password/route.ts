
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendEmail } from '@/services/EmailManager';

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
    
    // STEP 1: Validate if the email exists in the database first.
    const [users]: [RowDataPacket[], any] = await connection.execute(
      'SELECT id, name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // STEP 2: If not found, return a clear error message.
      return NextResponse.json({ success: false, message: 'Email tidak terdaftar di sistem kami.' }, { status: 404 });
    }
    const user = users[0];

    // STEP 3: Only if the user exists, proceed to generate token and send email.
    const token = randomBytes(32).toString('hex');
    const hashedToken = await hashToken(token);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

    await connection.execute<ResultSetHeader>(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, hashedToken, expiresAt]
    );

    // Get base URL from request headers
    const { protocol, host } = new URL(request.url);
    const baseUrl = `${protocol}//${host}`;
    const resetLink = `${baseUrl}/account/reset-password?token=${token}`;
    
    // Try sending the email. This function will throw an error if all SMTP servers fail.
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
                <p>Terima kasih,<br>Tim Maudigi</p>
               </div>`,
    });

    // If we reach here, the email was sent successfully.
    return NextResponse.json({ success: true, message: 'Link reset kata sandi telah dikirim ke email Anda.' });

  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
    // Return a generic server error to the client
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

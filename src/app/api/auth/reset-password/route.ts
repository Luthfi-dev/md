
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth-utils';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token tidak boleh kosong."),
  password: z.string().min(8, "Kata sandi baru harus minimal 8 karakter."),
});

export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }
    const { token, password } = validation.data;

    connection = await db.getConnection();
    
    // In a real app, you would hash the incoming token and compare it to the hashed token in the DB
    const [resetRows]: [RowDataPacket[], any] = await connection.execute(
      'SELECT user_id, expires_at FROM password_resets WHERE token = ?', // This should check the hashed token
      [token] // Placeholder for hashed token
    );

    if (resetRows.length === 0) {
      return NextResponse.json({ success: false, message: 'Token tidak valid atau telah digunakan.' }, { status: 400 });
    }
    
    const resetRequest = resetRows[0];
    if (new Date() > new Date(resetRequest.expires_at)) {
      return NextResponse.json({ success: false, message: 'Token telah kedaluwarsa.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    
    await connection.beginTransaction();

    // Update user's password
    await connection.execute<ResultSetHeader>(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, resetRequest.user_id]
    );

    // Invalidate the token
    await connection.execute(
      'DELETE FROM password_resets WHERE user_id = ?',
      [resetRequest.user_id]
    );

    await connection.commit();

    return NextResponse.json({ success: true, message: 'Kata sandi berhasil diatur ulang.' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('RESET PASSWORD ERROR:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

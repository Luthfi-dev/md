
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getAuthFromRequest, hashPassword, verifyPassword } from '@/lib/auth-utils';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Kata sandi lama wajib diisi."),
  newPassword: z.string().min(8, "Kata sandi baru harus minimal 8 karakter."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Kata sandi baru tidak cocok.",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  let connection;
  try {
    const user = getAuthFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        message: validation.error.errors.map(e => e.message).join(', ') 
      }, { status: 400 });
    }

    const { oldPassword, newPassword } = validation.data;

    connection = await db.getConnection();

    // 1. Get current password hash from DB
    const [rows]: [RowDataPacket[], any] = await connection.execute(
      'SELECT password FROM users WHERE id = ?',
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }
    const currentPasswordHash = rows[0].password;

    // 2. Verify old password
    const isOldPasswordValid = await verifyPassword(oldPassword, currentPasswordHash);
    if (!isOldPasswordValid) {
      return NextResponse.json({ success: false, message: 'Kata sandi lama yang Anda masukkan salah.' }, { status: 403 });
    }

    // 3. Hash the new password
    const newPasswordHash = await hashPassword(newPassword);

    // 4. Update the password in the database
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPasswordHash, user.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: 'Gagal memperbarui kata sandi.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });

  } catch (error) {
    console.error('Change password error:', error);
    const message = error instanceof Error ? `Server Error: ${error.message}` : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

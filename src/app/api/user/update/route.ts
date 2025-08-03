
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getAuthFromRequest } from '@/lib/auth-utils';
import type { ResultSetHeader } from 'mysql2';
import { encrypt, decrypt } from '@/lib/encryption';

const updateProfileSchema = z.object({
  name: z.string().min(3, "Nama harus memiliki setidaknya 3 karakter.").optional(),
  phone: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
  points: z.number().int().optional(),
});

export async function POST(request: Request) {
  let connection;
  try {
    const user = await getAuthFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        message: validation.error.errors.map(e => e.message).join(', ') 
      }, { status: 400 });
    }

    const dataToUpdate = validation.data;
    
    // --- Dynamic SQL Query Builder ---
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    
    // The Object.keys().forEach approach is safer against undefined values
    Object.keys(dataToUpdate).forEach(key => {
        const fieldKey = key as keyof typeof dataToUpdate;
        const value = dataToUpdate[fieldKey];

        if (value !== undefined) { // Check for undefined, allow null and empty strings
            switch(fieldKey) {
                case 'name':
                    updateFields.push('name = ?');
                    queryParams.push(value);
                    break;
                case 'phone':
                    updateFields.push('phone_number = ?');
                    queryParams.push(value ? encrypt(value as string) : null);
                    break;
                case 'avatar_url':
                     updateFields.push('avatar_url = ?');
                     queryParams.push(value); // value can be string path or null
                     break;
                case 'points':
                     updateFields.push('points = ?');
                     queryParams.push(encrypt(String(value)));
                     break;
            }
        }
    });
    
    if (updateFields.length === 0) {
      // Fetch current data and return it if nothing changed, to ensure consistency
       const [currentRows] : [any[], any] = await db.execute('SELECT id, name, email, role_id, status, avatar_url, phone_number, points, referral_code FROM users WHERE id = ?', [user.id]);
       if (currentRows.length === 0) {
           return NextResponse.json({ success: false, message: 'Pengguna tidak ditemukan.' }, { status: 404 });
       }
       const currentUser = currentRows[0];
       const decryptedPhone = currentUser.phone_number ? decrypt(currentUser.phone_number) : undefined;
       const decryptedPoints = currentUser.points ? parseInt(decrypt(currentUser.points), 10) : 0;
       const userForToken = { ...currentUser, phone: decryptedPhone, points: decryptedPoints };

       return NextResponse.json({ success: true, message: 'Tidak ada data untuk diperbarui.', user: userForToken });
    }
    
    const setClause = updateFields.join(', ');
    const sql = `UPDATE users SET ${setClause} WHERE id = ?`;
    
    queryParams.push(user.id);

    connection = await db.getConnection();
    const [result] = await connection.execute<ResultSetHeader>(sql, queryParams);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: 'Gagal memperbarui profil, pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Fetch the updated user data to return, ensuring data consistency
    const [rows]: [any[], any] = await connection.execute(
      'SELECT id, name, email, role_id, status, avatar_url, phone_number, points, referral_code FROM users WHERE id = ?',
      [user.id]
    );

    if (rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Gagal mengambil data pengguna yang diperbarui.' }, { status: 500 });
    }

    const updatedUserDb = rows[0];
    const decryptedPhone = updatedUserDb.phone_number ? decrypt(updatedUserDb.phone_number) : undefined;
    const decryptedPoints = updatedUserDb.points ? parseInt(decrypt(updatedUserDb.points), 10) : 0;


    const updatedUserForToken = {
        id: updatedUserDb.id,
        name: updatedUserDb.name,
        email: updatedUserDb.email,
        role: updatedUserDb.role_id,
        avatar: updatedUserDb.avatar_url,
        phone: decryptedPhone,
        points: decryptedPoints,
        referralCode: updatedUserDb.referral_code
    };

    return NextResponse.json({ 
        success: true, 
        message: 'Profil berhasil diperbarui.',
        user: updatedUserForToken
    });

  } catch (error) {
    console.error('Update profile error:', error);
    const message = error instanceof Error ? `Server Error: ${error.message}` : 'Terjadi kesalahan server yang tidak diketahui.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

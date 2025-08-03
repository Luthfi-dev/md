
'use client';

import { NextResponse, type NextRequest } from 'next/server';
import { hashPassword } from '@/lib/auth-utils';
import { z } from 'zod';
import { db } from '@/lib/db';
import type { ResultSetHeader } from 'mysql2';
import { randomBytes } from 'crypto';
import { decrypt, encrypt } from '@/lib/encryption';

const registerSchema = z.object({
  name: z.string().min(3, { message: "Nama harus memiliki setidaknya 3 karakter." }),
  email: z.string().email({ message: "Format email tidak valid." }),
  password: z.string().min(8, { message: "Kata sandi harus memiliki setidaknya 8 karakter." }),
  repeatPassword: z.string(),
  fingerprint: z.string().optional(),
  guestData: z.string().optional(), // Encrypted guest data
}).refine(data => data.password === data.repeatPassword, {
  message: "Kata sandi tidak cocok.",
  path: ["repeatPassword"],
});

const ROLE_ID_USER = 3; 

const generateReferralCode = () => {
    return randomBytes(4).toString('hex').toUpperCase();
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: validationResult.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const { name, email, password, fingerprint, guestData } = validationResult.data;
    
    let initialPoints = 0;
    if (guestData) {
        try {
            const decryptedGuestData = JSON.parse(decrypt(guestData));
            if (decryptedGuestData && typeof decryptedGuestData.points === 'number') {
                initialPoints = decryptedGuestData.points;
            }
        } catch (e) {
            console.warn("Could not parse guest data during registration:", e);
        }
    }
    
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Check for existing email
    const [existingUsersByEmail]: [any[], any] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsersByEmail.length > 0) {
      await connection.rollback();
      return NextResponse.json({ success: false, message: 'Email ini sudah terdaftar.' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const referralCode = generateReferralCode();
    const encryptedPoints = encrypt(String(initialPoints));


    const [userResult] = await connection.execute<ResultSetHeader>(
      'INSERT INTO users (name, email, password, role_id, referral_code, browser_fingerprint, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, ROLE_ID_USER, referralCode, fingerprint, encryptedPoints]
    );

    const newUserId = userResult.insertId;
    if (!newUserId) {
        throw new Error('Gagal membuat pengguna baru di tabel users.');
    }

    const [roleResult] = await connection.execute<ResultSetHeader>(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [newUserId, ROLE_ID_USER]
    );
    
    if (roleResult.affectedRows === 0) {
        throw new Error('Gagal menetapkan peran untuk pengguna baru.');
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil! Silakan masuk.',
      user: { id: newUserId, name, email, role: 'user' }
    }, { status: 201 });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
    return NextResponse.json({
      success: false,
      message: `Registrasi gagal: ${errorMessage}`
    }, { status: 500 });

  } finally {
      if (connection) {
          connection.release();
      }
  }
}

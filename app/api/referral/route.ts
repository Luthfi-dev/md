
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getAuthFromRequest } from '@/lib/auth-utils';
import type { ResultSetHeader } from 'mysql2';

const applyReferralSchema = z.object({
  referralCode: z.string().min(1, "Kode referral tidak boleh kosong."),
});

// Endpoint untuk user yang sudah login untuk memasukkan kode referral
export async function POST(request: Request) {
  let connection;
  try {
    const user = await getAuthFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const body = await request.json();
    const validation = applyReferralSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }
    const { referralCode } = validation.data;
    
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Cari pengguna yang memiliki kode referral ini (referrer)
    const [referrerRows]: [any[], any] = await connection.execute('SELECT id, browser_fingerprint FROM users WHERE referral_code = ?', [referralCode]);
    if (referrerRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ success: false, message: 'Kode referral tidak valid.' }, { status: 404 });
    }
    const referrer = referrerRows[0];

    // 2. Pastikan pengguna tidak me-refer diri sendiri
    if (referrer.id === user.id) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: 'Anda tidak dapat menggunakan kode referral Anda sendiri.' }, { status: 400 });
    }

    // 3. Cek apakah pengguna sudah pernah di-refer oleh orang lain
    const [existingReferralRows]: [any[], any] = await connection.execute('SELECT id FROM referrals WHERE referred_id = ?', [user.id]);
    if (existingReferralRows.length > 0) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: 'Anda sudah pernah menggunakan kode referral.' }, { status: 400 });
    }

    // 4. Deteksi kecurangan: bandingkan fingerprint browser
    const [referredUserRows]: [any[], any] = await connection.execute('SELECT browser_fingerprint FROM users WHERE id = ?', [user.id]);
    const referredUser = referredUserRows[0];
    const isFraud = referrer.browser_fingerprint && referredUser.browser_fingerprint && referrer.browser_fingerprint === referredUser.browser_fingerprint;

    const referralStatus = isFraud ? 'invalid' : 'valid';

    // 5. Buat entri di tabel referrals
    await connection.execute<ResultSetHeader>(
      'INSERT INTO referrals (referrer_id, referred_id, status) VALUES (?, ?, ?)',
      [referrer.id, user.id, referralStatus]
    );

    // 6. Jika valid, tambahkan poin ke kedua pengguna
    if (referralStatus === 'valid') {
        const rewardPoints = 200; // Bisa diambil dari pengaturan admin nanti
        await connection.execute('UPDATE users SET points = points + ? WHERE id = ?', [rewardPoints, referrer.id]);
        await connection.execute('UPDATE users SET points = points + ? WHERE id = ?', [rewardPoints, user.id]);
    }

    await connection.commit();

    return NextResponse.json({ 
        success: true, 
        message: referralStatus === 'valid' 
            ? 'Kode referral berhasil diterapkan! Anda dan teman Anda mendapatkan 200 poin.' 
            : 'Kode referral diterima, namun terdeteksi aktivitas mencurigakan. Poin tidak ditambahkan.'
    }, { status: 200 });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Referral error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

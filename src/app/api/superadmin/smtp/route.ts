
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import { encrypt } from '@/lib/encryption';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const smtpConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int(),
  secure: z.boolean(),
  user: z.string().min(1),
  pass: z.string().min(1),
});

// GET all SMTP configs (passwords are not returned)
export async function GET(request: NextRequest) {
    const user = getAuthFromRequest(request);
    if (!user || user.role !== 1) { // Super Admin Only
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [rows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT id, host, port, secure, user, status, last_used_at FROM smtp_configurations ORDER BY last_used_at DESC`
        );
        return NextResponse.json({ success: true, configs: rows });
    } catch (error) {
        console.error("GET SMTP CONFIGS ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat mengambil konfigurasi SMTP.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


// CREATE a new SMTP config
export async function POST(request: NextRequest) {
    const user = getAuthFromRequest(request);
    if (!user || user.role !== 1) {
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }
    
    let connection;
    try {
        const body = await request.json();
        const validation = smtpConfigSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { host, port, secure, user: smtpUser, pass } = validation.data;
        const encryptedPass = encrypt(pass);

        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>(
            'INSERT INTO smtp_configurations (host, port, secure, user, pass) VALUES (?, ?, ?, ?, ?)',
            [host, port, secure, smtpUser, encryptedPass]
        );

        return NextResponse.json({ success: true, message: 'Konfigurasi SMTP berhasil ditambahkan', configId: result.insertId }, { status: 201 });
    } catch (error: any) {
        console.error("CREATE SMTP CONFIG ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// DELETE an SMTP config
export async function DELETE(request: NextRequest) {
    const user = getAuthFromRequest(request);
    if (!user || user.role !== 1) {
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ success: false, message: 'ID Konfigurasi SMTP diperlukan' }, { status: 400 });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>(
            'DELETE FROM smtp_configurations WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, message: 'Konfigurasi SMTP tidak ditemukan.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Konfigurasi SMTP berhasil dihapus.' });
    } catch (error: any) {
        console.error("DELETE SMTP CONFIG ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

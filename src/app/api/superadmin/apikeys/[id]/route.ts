'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import { encrypt, decrypt } from '@/lib/encryption';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { clearCache } from '@/services/ApiKeyManager';

const apiKeyUpdateSchema = z.object({
  key: z.string().min(10, 'Kunci API tampaknya terlalu pendek'),
});

// GET a single key's full value
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await getAuthFromRequest(request);
    if (!user || user.role !== 1) {
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }
    const { id } = params;
    
    let connection;
    try {
        connection = await db.getConnection();
        const [rows]: [RowDataPacket[], any] = await connection.execute(
            'SELECT api_key FROM ai_api_keys WHERE id = ?', [id]
        );
        if (rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Kunci tidak ditemukan' }, { status: 404 });
        }
        const decryptedKey = decrypt(rows[0].api_key);
        return NextResponse.json({ success: true, key: decryptedKey });

    } catch (error) {
        console.error("GET API KEY DETAIL ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


// UPDATE a key
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await getAuthFromRequest(request);
    if (!user || user.role !== 1) {
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }
    const { id } = params;

    let connection;
    try {
        const body = await request.json();
        const validation = apiKeyUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }

        const { key } = validation.data;
        const encryptedKey = encrypt(key);

        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>(
            'UPDATE ai_api_keys SET api_key = ?, failure_count = 0, status = \'active\' WHERE id = ?',
            [encryptedKey, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, message: 'Kunci API tidak ditemukan.' }, { status: 404 });
        }

        await clearCache();

        return NextResponse.json({ success: true, message: 'Kunci API berhasil diperbarui.' });

    } catch (error) {
        console.error("UPDATE API KEY ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat memperbarui kunci.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

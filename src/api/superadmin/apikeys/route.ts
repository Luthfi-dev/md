
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { clearCache } from '@/services/ApiKeyManager';

const apiKeySchema = z.object({
  service: z.enum(['gemini']),
  key: z.string().min(10, 'Kunci API tampaknya terlalu pendek'),
});

// GET all keys (previews only for security)
export async function GET(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user || user.role !== 1) { // Super Admin Only
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT id, service, SUBSTRING(api_key, -4) as key_preview, status, failure_count, last_used_at 
             FROM ai_api_keys ORDER BY last_used_at DESC`
        );
        return NextResponse.json({ success: true, keys: rows });
    } catch (error) {
        console.error("GET API KEYS ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat mengambil kunci API.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// CREATE a new key
export async function POST(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user || user.role !== 1) {
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }
    
    let connection;
    try {
        const body = await request.json();
        const validation = apiKeySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { service, key } = validation.data;

        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>(
            'INSERT INTO ai_api_keys (service, api_key) VALUES (?, ?)',
            [service, key] // Store plain text
        );

        await clearCache();

        return NextResponse.json({ success: true, message: 'Kunci API berhasil ditambahkan', keyId: result.insertId }, { status: 201 });
    } catch (error: any) {
        console.error("CREATE API KEY ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// DELETE a key
export async function DELETE(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user || user.role !== 1) {
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ success: false, message: 'ID Kunci API diperlukan' }, { status: 400 });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>(
            'DELETE FROM ai_api_keys WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, message: 'Kunci API tidak ditemukan.' }, { status: 404 });
        }

        await clearCache();

        return NextResponse.json({ success: true, message: 'Kunci API berhasil dihapus.' });
    } catch (error: any) {
        console.error("DELETE API KEY ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

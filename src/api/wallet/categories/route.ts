
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori tidak boleh kosong"),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional().default('Package'),
});

// GET all categories for a user
export async function GET(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [categories]: [RowDataPacket[], any] = await connection.execute(
            `SELECT id, name, type, icon FROM transaction_categories WHERE user_id = ? OR user_id IS NULL ORDER BY user_id, name ASC`,
            [user.id]
        );
        return NextResponse.json({ success: true, categories });
    } catch (error) {
        console.error("GET CATEGORIES ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat mengambil kategori.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// CREATE a new category
export async function POST(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    let connection;
    try {
        const body = await request.json();
        const validation = categorySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { name, type, icon } = validation.data;

        connection = await db.getConnection();
        
        const [result] = await connection.execute<ResultSetHeader>(
            'INSERT INTO transaction_categories (user_id, name, type, icon) VALUES (?, ?, ?, ?)',
            [user.id, name, type, icon]
        );

        return NextResponse.json({ success: true, message: 'Kategori berhasil ditambahkan', categoryId: result.insertId }, { status: 201 });

    } catch (error: any) {
        console.error("CREATE CATEGORY ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

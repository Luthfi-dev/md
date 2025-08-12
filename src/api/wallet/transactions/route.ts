
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const transactionSchema = z.object({
  amount: z.number().positive("Jumlah harus lebih dari nol"),
  type: z.enum(['income', 'expense']),
  categoryId: z.number().int().positive("Kategori tidak valid"),
  description: z.string().max(255).optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
});


// GET all transactions for a user
export async function GET(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [transactions]: [RowDataPacket[], any] = await connection.execute(
            `SELECT t.id, t.amount, t.type, t.description, t.transaction_date, t.category_id, c.name as category_name, c.icon as category_icon
             FROM transactions t
             JOIN transaction_categories c ON t.category_id = c.id
             WHERE t.user_id = ?
             ORDER BY t.transaction_date DESC, t.created_at DESC`,
            [user.id]
        );
        
        // Ensure categoryId is correctly named for frontend consumption
        const formattedTransactions = transactions.map(t => ({
            ...t,
            categoryId: t.category_id
        }));

        return NextResponse.json({ success: true, transactions: formattedTransactions });
    } catch (error) {
        console.error("GET TRANSACTIONS ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat mengambil transaksi.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


// CREATE a new transaction
export async function POST(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    let connection;
    try {
        const body = await request.json();
        const validation = transactionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { amount, type, categoryId, description, transactionDate } = validation.data;

        connection = await db.getConnection();
        
        // Verify category belongs to user
        const [categoryRows]: [RowDataPacket[], any] = await connection.execute(
            'SELECT id FROM transaction_categories WHERE id = ? AND (user_id = ? OR user_id IS NULL) AND type = ?',
            [categoryId, user.id, type]
        );

        if (categoryRows.length === 0) {
            return NextResponse.json({ success: false, message: 'Kategori tidak valid atau tidak cocok dengan tipe transaksi.' }, { status: 400 });
        }

        const [result] = await connection.execute<ResultSetHeader>(
            'INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, categoryId, amount, type, description || null, transactionDate]
        );

        return NextResponse.json({ success: true, message: 'Transaksi berhasil ditambahkan', transactionId: result.insertId }, { status: 201 });

    } catch (error: any) {
        console.error("CREATE TRANSACTION ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const budgetSchema = z.object({
  categoryId: z.number().int().positive(),
  amount: z.number().min(0),
});

const budgetPostSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  budgets: z.array(budgetSchema),
});


// GET budgets for a specific month
export async function GET(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ success: false, message: 'Format bulan tidak valid (YYYY-MM)' }, { status: 400 });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [budgets]: [RowDataPacket[], any] = await connection.execute(
            `SELECT id, category_id, amount, month FROM budgets WHERE user_id = ? AND month = ?`,
            [user.id, month]
        );
        const formattedBudgets = budgets.map(b => ({
            id: b.id,
            categoryId: b.category_id,
            amount: parseFloat(b.amount),
            month: b.month
        }));

        return NextResponse.json({ success: true, budgets: formattedBudgets });
    } catch (error) {
        console.error("GET BUDGETS ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat mengambil anggaran.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


// CREATE or UPDATE budgets for a month
export async function POST(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    let connection;
    try {
        const body = await request.json();
        const validation = budgetPostSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { month, budgets } = validation.data;

        connection = await db.getConnection();
        await connection.beginTransaction();

        for (const budget of budgets) {
            await connection.execute(
                `INSERT INTO budgets (user_id, category_id, amount, month)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
                [user.id, budget.categoryId, budget.amount, month]
            );
        }

        await connection.commit();

        return NextResponse.json({ success: true, message: 'Anggaran berhasil disimpan.' }, { status: 200 });

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("SAVE BUDGETS ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

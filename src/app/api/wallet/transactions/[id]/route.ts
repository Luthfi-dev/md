
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import type { ResultSetHeader } from 'mysql2';

// DELETE a transaction
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { id } = params;
    const transactionId = parseInt(id, 10);
    if (isNaN(transactionId)) {
        return NextResponse.json({ success: false, message: 'ID transaksi tidak valid' }, { status: 400 });
    }

    let connection;
    try {
        connection = await db.getConnection();
        // The WHERE clause ensures a user can only delete their own transactions
        const [result] = await connection.execute<ResultSetHeader>(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            [transactionId, user.id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, message: 'Transaksi tidak ditemukan atau Anda tidak memiliki izin untuk menghapus.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus.' });

    } catch (error: any) {
        console.error("DELETE TRANSACTION ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

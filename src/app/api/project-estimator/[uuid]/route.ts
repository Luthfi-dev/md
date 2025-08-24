
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getAuthFromRequest } from '@/lib/auth-utils';

// This endpoint handles GET (public/authenticated) and DELETE (authenticated only) for a single project.

// GET a single project's details
export async function GET(request: NextRequest, { params }: { params: { uuid: string } }) {
    const { uuid } = params;
    if (!uuid) {
        return NextResponse.json({ success: false, message: 'UUID Proyek diperlukan' }, { status: 400 });
    }

    let connection;
    try {
        connection = await db.getConnection();
        
        const [projectRows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT p.title, p.total_min_price, p.total_max_price, p.created_at, u.name as author_name
             FROM project_estimations p
             JOIN users u ON p.user_id = u.id
             WHERE p.uuid = ?`,
            [uuid]
        );

        if (projectRows.length === 0) {
            return NextResponse.json({ success: false, message: 'Estimasi proyek tidak ditemukan.' }, { status: 404 });
        }
        const projectData = projectRows[0];
        
        const [featureRows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT f.description, f.price_min, f.price_max, f.justification
             FROM project_features f
             JOIN project_estimations p ON f.project_id = p.id
             WHERE p.uuid = ?`,
            [uuid]
        );
        
        const estimation = {
            ...projectData,
            features: featureRows
        };
        
        return NextResponse.json({ success: true, estimation });

    } catch (error) {
        console.error("GET PROJECT DETAIL ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat mengambil detail estimasi.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// DELETE a project estimation
export async function DELETE(request: NextRequest, { params }: { params: { uuid: string } }) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }
    
    const { uuid } = params;
    if (!uuid) {
        return NextResponse.json({ success: false, message: 'UUID Proyek diperlukan' }, { status: 400 });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>(
            'DELETE FROM project_estimations WHERE uuid = ? AND user_id = ?',
            [uuid, user.id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, message: 'Proyek tidak ditemukan atau Anda tidak memiliki izin untuk menghapus.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Proyek berhasil dihapus.' });
    } catch (error) {
        console.error("DELETE PROJECT ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat menghapus proyek.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

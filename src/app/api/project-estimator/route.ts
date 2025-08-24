
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const featureSchema = z.object({
  description: z.string(),
  priceMin: z.number(),
  priceMax: z.number(),
  justification: z.string(),
});

const projectEstimationSchema = z.object({
  uuid: z.string().uuid(),
  title: z.string().min(1, 'Judul proyek tidak boleh kosong'),
  features: z.array(featureSchema),
  totalMinPrice: z.number(),
  totalMaxPrice: z.number(),
});

// GET all saved project estimations for a user
export async function GET(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [rows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT uuid, title, total_min_price, total_max_price, created_at 
             FROM project_estimations 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [user.id]
        );
        return NextResponse.json({ success: true, estimations: rows });
    } catch (error) {
        console.error("GET PROJECT ESTIMATIONS ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat mengambil data estimasi.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


// POST a new project estimation
export async function POST(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    let connection;
    try {
        const body = await request.json();
        const validation = projectEstimationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { uuid, title, features, totalMinPrice, totalMaxPrice } = validation.data;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [projectResult] = await connection.execute<ResultSetHeader>(
            `INSERT INTO project_estimations (uuid, user_id, title, total_min_price, total_max_price)
             VALUES (?, ?, ?, ?, ?)`,
            [uuid, user.id, title, totalMinPrice, totalMaxPrice]
        );
        const newProjectId = projectResult.insertId;

        if (features.length > 0) {
            const featureValues = features.map(f => [newProjectId, f.description, f.priceMin, f.priceMax, f.justification]);
            await connection.query(
                `INSERT INTO project_features (project_id, description, price_min, price_max, justification) VALUES ?`,
                [featureValues]
            );
        }

        await connection.commit();

        return NextResponse.json({ success: true, message: 'Estimasi proyek berhasil disimpan.', projectId: newProjectId }, { status: 201 });

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("SAVE PROJECT ESTIMATION ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// PUT (update) an existing project estimation
export async function PUT(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    let connection;
    try {
        const body = await request.json();
        const validation = projectEstimationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }

        const { uuid, title, features, totalMinPrice, totalMaxPrice } = validation.data;
        
        connection = await db.getConnection();
        
        // First, verify the project exists and belongs to the user
        const [projectRows]:[RowDataPacket[], any] = await connection.execute(
            'SELECT id FROM project_estimations WHERE uuid = ? AND user_id = ?', [uuid, user.id]
        );

        if (projectRows.length === 0) {
            return NextResponse.json({ success: false, message: 'Proyek tidak ditemukan atau Anda tidak memiliki izin.' }, { status: 404 });
        }
        const projectId = projectRows[0].id;
        
        await connection.beginTransaction();

        // Update the main project details
        await connection.execute<ResultSetHeader>(
            `UPDATE project_estimations SET title = ?, total_min_price = ?, total_max_price = ?
             WHERE id = ?`,
            [title, totalMinPrice, totalMaxPrice, projectId]
        );
        
        // Sync features: delete old ones and insert the new set
        await connection.execute<ResultSetHeader>('DELETE FROM project_features WHERE project_id = ?', [projectId]);
        
        if (features.length > 0) {
            const featureValues = features.map(f => [projectId, f.description, f.priceMin, f.priceMax, f.justification]);
            await connection.query(
                `INSERT INTO project_features (project_id, description, price_min, price_max, justification) VALUES ?`,
                [featureValues]
            );
        }

        await connection.commit();

        return NextResponse.json({ success: true, message: 'Estimasi proyek berhasil diperbarui.' });

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("UPDATE PROJECT ESTIMATION ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

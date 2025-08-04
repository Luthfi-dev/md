
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { Note } from '@/types/notebook';

const createNoteSchema = z.object({
  uuid: z.string().uuid(),
  title: z.string().min(1, "Judul tidak boleh kosong"),
  // Items are optional on creation
});


// GET all personal notes
export async function GET(request: NextRequest) {
    const user = getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }
    
    let connection;
    try {
        connection = await db.getConnection();
        const [rows]: [RowDataPacket[], any] = await connection.execute(
            'SELECT id, uuid, title, created_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
            [user.id]
        );

        // Although we can fetch items here, it's better to do it on the single-note GET for performance
        // This keeps the list view fast.
        const notes: Partial<Note>[] = rows.map(row => ({
            id: row.id,
            uuid: row.uuid,
            title: row.title,
            createdAt: row.created_at,
            items: [] // Placeholder, will be fetched on detail page
        }));
        
        return NextResponse.json({ success: true, notes });

    } catch (error) {
        console.error("GET ALL NOTES ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// CREATE a new personal note
export async function POST(request: NextRequest) {
    const user = getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }
    
    let connection;
    try {
        const body = await request.json();
        const validation = createNoteSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }

        const { uuid, title } = validation.data;
        
        connection = await db.getConnection();
        const [result]: [ResultSetHeader, any] = await connection.execute(
            'INSERT INTO notes (user_id, uuid, title) VALUES (?, ?, ?)',
            [user.id, uuid, title]
        );
        
        const newNoteId = result.insertId;

        return NextResponse.json({ success: true, noteId: newNoteId, uuid });

    } catch (error: any) {
        console.error("CREATE NOTE ERROR: ", error);
        // Handle unique constraint violation for uuid
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ success: false, message: 'Gagal membuat catatan, UUID duplikat.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: 'Kesalahan server' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

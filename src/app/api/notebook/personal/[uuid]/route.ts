
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { Note, ChecklistItem } from '@/types/notebook';

const noteItemSchema = z.object({
    uuid: z.string().uuid(),
    label: z.string(),
    completed: z.boolean(),
});

const noteSchema = z.object({
    uuid: z.string().uuid(),
    title: z.string().min(1, "Judul tidak boleh kosong"),
    items: z.array(noteItemSchema),
});


// GET a single note
export async function GET(request: NextRequest, { params }: { params: { uuid: string } }) {
    const user = getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { uuid } = params;
    let connection;

    try {
        connection = await db.getConnection();
        const [noteRows]: [RowDataPacket[], any] = await connection.execute(
            'SELECT id, uuid, title, created_at FROM notes WHERE uuid = ? AND user_id = ?',
            [uuid, user.id]
        );

        if (noteRows.length === 0) {
            return NextResponse.json({ success: false, message: 'Catatan tidak ditemukan' }, { status: 404 });
        }

        const noteDb = noteRows[0];

        const [itemRows]: [RowDataPacket[], any] = await connection.execute(
            'SELECT uuid, label, completed FROM note_items WHERE note_id = ?',
            [noteDb.id]
        );

        const note: Note = {
            id: noteDb.id,
            uuid: noteDb.uuid,
            title: noteDb.title,
            createdAt: noteDb.created_at,
            items: itemRows.map(item => ({
                id: item.uuid, // Using uuid as id for client-side key
                uuid: item.uuid,
                label: item.label,
                completed: item.completed
            }))
        };
        
        return NextResponse.json({ success: true, note });

    } catch (error) {
        console.error("GET NOTE ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// UPDATE a note
export async function PUT(request: NextRequest, { params }: { params: { uuid: string } }) {
    const user = getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { uuid } = params;
    let connection;

    try {
        const body = await request.json();
        const validation = noteSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { title, items } = validation.data;
        
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [noteRows]: [RowDataPacket[], any] = await connection.execute(
            'SELECT id FROM notes WHERE uuid = ? AND user_id = ?',
            [uuid, user.id]
        );

        if (noteRows.length === 0) {
            await connection.rollback();
            return NextResponse.json({ success: false, message: 'Catatan tidak ditemukan' }, { status: 404 });
        }
        const noteId = noteRows[0].id;

        // Update note title
        await connection.execute(
            'UPDATE notes SET title = ? WHERE id = ?',
            [title, noteId]
        );

        // Sync items (delete old, insert new) - a simple but effective strategy
        await connection.execute('DELETE FROM note_items WHERE note_id = ?', [noteId]);

        if (items.length > 0) {
            const itemValues = items.map(item => [noteId, item.uuid, item.label, item.completed]);
            await connection.query(
                'INSERT INTO note_items (note_id, uuid, label, completed) VALUES ?',
                [itemValues]
            );
        }

        await connection.commit();
        
        return NextResponse.json({ success: true, message: 'Catatan berhasil diperbarui' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("UPDATE NOTE ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


// DELETE a note
export async function DELETE(request: NextRequest, { params }: { params: { uuid: string } }) {
     const user = getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { uuid } = params;
    let connection;

    try {
        connection = await db.getConnection();
        const [result]: [ResultSetHeader, any] = await connection.execute(
            'DELETE FROM notes WHERE uuid = ? AND user_id = ?',
            [uuid, user.id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, message: 'Catatan tidak ditemukan atau Anda tidak punya akses' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Catatan berhasil dihapus' });
    } catch (error) {
        console.error("DELETE NOTE ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const noteItemSchema = z.object({
  id: z.any(),
  uuid: z.string().uuid(),
  label: z.string(),
  completed: z.boolean(),
});

const noteSchema = z.object({
  id: z.any(),
  uuid: z.string().uuid(),
  title: z.string().min(1, "Judul tidak boleh kosong"),
  items: z.array(noteItemSchema),
  createdAt: z.string().datetime(),
  userId: z.number().optional(),
  isSynced: z.boolean().optional(),
});

const syncSchema = z.object({
    notes: z.array(noteSchema)
});

// Endpoint for bulk syncing local notes to the cloud
export async function POST(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    let connection;
    try {
        const body = await request.json();
        const validation = syncSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { notes: localNotes } = validation.data;
        if (localNotes.length === 0) {
            return NextResponse.json({ success: true, message: 'Tidak ada catatan untuk disinkronkan.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existingNoteRows]: [RowDataPacket[], any] = await connection.execute(
            'SELECT uuid, id FROM notes WHERE user_id = ? AND uuid IN (?)',
            [user.id, localNotes.map(note => note.uuid)]
        );
        const existingNotesMap = new Map(existingNoteRows.map(row => [row.uuid, row.id]));

        for (const note of localNotes) {
            // Only sync if it doesn't already exist in the cloud for this user
            if (!existingNotesMap.has(note.uuid)) {
                // Insert new note
                const [noteResult]: [ResultSetHeader, any] = await connection.execute(
                    'INSERT INTO notes (user_id, uuid, title, content, created_at) VALUES (?, ?, ?, ?, ?)',
                    [user.id, note.uuid, note.title, '', new Date(note.createdAt)]
                );
                const newNoteId = noteResult.insertId;

                // Insert items for the new note
                if (note.items.length > 0) {
                    const itemValues = note.items.map(item => [newNoteId, item.uuid, item.label, item.completed]);
                    if (itemValues.length > 0) {
                       await connection.query(
                           'INSERT INTO note_items (note_id, uuid, label, completed) VALUES ?',
                           [itemValues]
                       );
                    }
                }
            }
        }
        
        await connection.commit();
        
        return NextResponse.json({ success: true, message: 'Sinkronisasi berhasil.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("SYNC NOTES ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat sinkronisasi' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const localNoteItemSchema = z.object({
  uuid: z.string().uuid("UUID item tidak valid"),
  label: z.string(),
  completed: z.boolean(),
});

const localNoteSyncSchema = z.object({
  uuid: z.string().uuid("UUID catatan tidak valid"),
  title: z.string(),
  items: z.array(localNoteItemSchema).optional(),
  createdAt: z.string().datetime().optional(), 
});

const syncSchema = z.object({
    notes: z.array(localNoteSyncSchema)
});

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
            const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return NextResponse.json({ success: false, message: errorMessages || "Data tidak valid" }, { status: 400 });
        }
        
        const { notes: localNotes } = validation.data;
        if (localNotes.length === 0) {
            return NextResponse.json({ success: true, message: 'Tidak ada catatan untuk disinkronkan.' });
        }

        connection = await db.getConnection();
        
        for (const note of localNotes) {
            await connection.beginTransaction();

            try {
                // Upsert Note (Update or Insert)
                await connection.execute(
                    `INSERT INTO notes (user_id, uuid, title, content, created_at)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), updated_at = CURRENT_TIMESTAMP`,
                    [user.id, note.uuid, note.title, '', note.createdAt ? new Date(note.createdAt) : new Date()]
                );
                
                const [noteRow]: [RowDataPacket[], any] = await connection.execute('SELECT id FROM notes WHERE uuid = ? AND user_id = ?', [note.uuid, user.id]);
                const noteId = noteRow[0].id;

                const itemsToSync = note.items || [];
                
                if (itemsToSync.length > 0) {
                     for (const item of itemsToSync) {
                        await connection.execute(
                            `INSERT INTO note_items (note_id, uuid, label, completed)
                             VALUES (?, ?, ?, ?)
                             ON DUPLICATE KEY UPDATE label = VALUES(label), completed = VALUES(completed)`,
                            [noteId, item.uuid, item.label, item.completed]
                        );
                    }
                }
                
                const incomingItemUuids = itemsToSync.map(i => i.uuid);
                if (incomingItemUuids.length > 0) {
                    await connection.execute(
                        'DELETE FROM note_items WHERE note_id = ? AND uuid NOT IN (?)',
                        [noteId, incomingItemUuids]
                    );
                } else {
                    await connection.execute('DELETE FROM note_items WHERE note_id = ?', [noteId]);
                }


                await connection.commit();
            } catch (innerError) {
                if (connection) await connection.rollback();
                console.error(`Gagal menyinkronkan catatan ${note.uuid}:`, innerError);
                throw innerError;
            }
        }
        
        return NextResponse.json({ success: true, message: 'Sinkronisasi berhasil.' });

    } catch (error) {
        console.error("SYNC NOTES ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat sinkronisasi' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

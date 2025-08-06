
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const taskCreateSchema = z.object({
  uuid: z.string().uuid("UUID Tugas tidak valid"),
  label: z.string().min(1, "Nama tugas tidak boleh kosong"),
  assignedTo: z.array(z.number()).optional(),
  items: z.array(z.object({
    uuid: z.string().uuid(),
    label: z.string(),
    completed: z.boolean()
  })).optional()
});

// CREATE a new task in a group
export async function POST(request: NextRequest, { params }: { params: { uuid: string } }) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { uuid: groupUuid } = params;
    let connection;

    try {
        const body = await request.json();
        const validation = taskCreateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { uuid: taskUuid, label, assignedTo, items } = validation.data;

        connection = await db.getConnection();
        
        const [groupRows]: [RowDataPacket[], any] = await connection.execute(
            'SELECT id FROM note_groups WHERE uuid = ?',
            [groupUuid]
        );

        if (groupRows.length === 0) {
            return NextResponse.json({ success: false, message: 'Grup tidak ditemukan.' }, { status: 404 });
        }
        const groupId = groupRows[0].id;

        await connection.beginTransaction();

        const [taskResult] = await connection.execute<ResultSetHeader>(
            'INSERT INTO group_tasks (group_id, uuid, label, created_by) VALUES (?, ?, ?, ?)',
            [groupId, taskUuid, label, user.id]
        );
        const newTaskId = taskResult.insertId;

        if (assignedTo && assignedTo.length > 0) {
            const assigneeValues = assignedTo.map(userId => [newTaskId, userId]);
            await connection.query(
                'INSERT INTO group_task_assignees (task_id, user_id) VALUES ?',
                [assigneeValues]
            );
        }

        if (items && items.length > 0) {
            const itemValues = items.map(item => [newTaskId, item.uuid, item.label, item.completed]);
            await connection.query(
                'INSERT INTO group_task_items (task_id, uuid, label, completed) VALUES ?',
                [itemValues]
            );
        }

        await connection.commit();
        
        return NextResponse.json({ success: true, message: 'Tugas berhasil dibuat', taskId: newTaskId }, { status: 201 });

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("CREATE GROUP TASK ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

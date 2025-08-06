
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const taskUpdateSchema = z.object({
  label: z.string().min(1, "Nama tugas tidak boleh kosong").optional(),
  completed: z.boolean().optional(),
  assignedTo: z.array(z.number()).optional(),
  items: z.array(z.object({
    uuid: z.string().uuid(),
    label: z.string(),
    completed: z.boolean()
  })).optional()
});

// UPDATE a task
export async function PUT(request: NextRequest, { params }: { params: { uuid: string, taskUuid: string } }) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { uuid: groupUuid, taskUuid } = params;
    let connection;

    try {
        const body = await request.json();
        const validation = taskUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { label, completed, assignedTo, items } = validation.data;
        
        connection = await db.getConnection();

        // Verify user is part of the group
         const [memberRows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT gm.role, g.id as groupId, t.id as taskId
             FROM group_members gm
             JOIN note_groups g ON gm.group_id = g.id
             LEFT JOIN group_tasks t ON g.id = t.group_id AND t.uuid = ?
             WHERE g.uuid = ? AND gm.user_id = ?`,
            [taskUuid, groupUuid, user.id]
        );
        
        if (memberRows.length === 0) {
            return NextResponse.json({ success: false, message: 'Grup tidak ditemukan atau Anda bukan anggota.'}, { status: 404 });
        }
        
        const { role, taskId } = memberRows[0];

        if (!taskId) {
            return NextResponse.json({ success: false, message: 'Tugas tidak ditemukan di dalam grup ini.' }, { status: 404 });
        }

        // --- Permission Checks ---
        const isEditingJustCompletion = completed !== undefined && label === undefined && assignedTo === undefined && items === undefined;
        const isEditingJustItems = items !== undefined && completed !== undefined && label === undefined && assignedTo === undefined;
        const isAssigned = (await connection.execute('SELECT COUNT(*) as count FROM group_task_assignees WHERE task_id = ? AND user_id = ?', [taskId, user.id]) as RowDataPacket[][])[0][0].count > 0;
        const isAssignedToAll = (await connection.execute('SELECT COUNT(*) as count FROM group_task_assignees WHERE task_id = ?', [taskId]) as RowDataPacket[][])[0][0].count === 0;

        // Allow editing completion or items if assigned (or assigned to all)
        if (isEditingJustCompletion || isEditingJustItems) {
            if (!isAssigned && !isAssignedToAll) {
                return NextResponse.json({ success: false, message: 'Anda tidak ditugaskan untuk tugas ini.' }, { status: 403 });
            }
        } else if (role !== 'admin') {
             // For other edits (label, assignees), require admin
             return NextResponse.json({ success: false, message: 'Hanya admin yang dapat mengedit detail tugas.' }, { status: 403 });
        }

        await connection.beginTransaction();

        // Update task properties if they exist
        if (label !== undefined || completed !== undefined) {
             const updateFields: string[] = [];
             const queryParams: any[] = [];
             if (label !== undefined) {
                updateFields.push('label = ?');
                queryParams.push(label);
             }
             if (completed !== undefined) {
                updateFields.push('completed = ?');
                queryParams.push(completed);
             }
             queryParams.push(taskId);

             await connection.execute(`UPDATE group_tasks SET ${updateFields.join(', ')} WHERE id = ?`, queryParams);
        }

        // Sync assignees
        if (assignedTo !== undefined) {
            await connection.execute('DELETE FROM group_task_assignees WHERE task_id = ?', [taskId]);
            if (assignedTo.length > 0) {
                const assigneeValues = assignedTo.map(userId => [taskId, userId]);
                await connection.query('INSERT INTO group_task_assignees (task_id, user_id) VALUES ?', [assigneeValues]);
            }
        }
        
        // Sync checklist items
        if (items !== undefined) {
            await connection.execute('DELETE FROM group_task_items WHERE task_id = ?', [taskId]);
            if (items.length > 0) {
                const itemValues = items.map(item => [item.uuid, taskId, item.label, item.completed]);
                await connection.query(
                    'INSERT INTO group_task_items (uuid, task_id, label, completed) VALUES ?',
                    [itemValues]
                );
            }
        }

        await connection.commit();

        return NextResponse.json({ success: true, message: 'Tugas berhasil diperbarui.' });

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("UPDATE GROUP TASK ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


// DELETE a task
export async function DELETE(request: NextRequest, { params }: { params: { uuid: string, taskUuid: string } }) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { uuid: groupUuid, taskUuid } = params;
    let connection;

    try {
        connection = await db.getConnection();

        // Verify user is an admin of the group before deleting
         const [taskRows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT t.id FROM group_tasks t
             JOIN note_groups g ON t.group_id = g.id
             JOIN group_members gm ON g.id = gm.group_id
             WHERE t.uuid = ? AND g.uuid = ? AND gm.user_id = ? AND gm.role = 'admin'`,
            [taskUuid, groupUuid, user.id]
        );

        if (taskRows.length === 0) {
            return NextResponse.json({ success: false, message: 'Tugas tidak ditemukan atau Anda tidak memiliki izin untuk menghapus.' }, { status: 403 });
        }
        const taskId = taskRows[0].id;

        const [result] = await connection.execute<ResultSetHeader>(
            'DELETE FROM group_tasks WHERE id = ?',
            [taskId]
        );
        
        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, message: 'Gagal menghapus tugas.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Tugas berhasil dihapus.' });

    } catch (error: any) {
        console.error("DELETE GROUP TASK ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

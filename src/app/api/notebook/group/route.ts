
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { NotebookGroup, GroupMember } from '@/types/notebook';

const createGroupSchema = z.object({
  uuid: z.string().uuid("UUID grup tidak valid"),
  title: z.string().min(1, "Judul grup tidak boleh kosong"),
  description: z.string().optional(),
});


// GET all groups for a user
export async function GET(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }
    
    let connection;
    try {
        connection = await db.getConnection();
        const [groupsRows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT g.id, g.uuid, g.title, g.description, g.avatar_url, g.created_at, g.updated_at
             FROM note_groups g
             JOIN group_members gm ON g.id = gm.group_id
             WHERE gm.user_id = ? ORDER BY g.updated_at DESC`,
            [user.id]
        );

        if (groupsRows.length === 0) {
            return NextResponse.json({ success: true, groups: [] });
        }

        const groupIds = groupsRows.map(g => g.id);
        const placeholders = groupIds.map(() => '?').join(',');

        const [membersRows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT gm.group_id, u.id, u.name, u.avatar_url, gm.role
             FROM users u
             JOIN group_members gm ON u.id = gm.user_id
             WHERE gm.group_id IN (${placeholders})`,
            groupIds
        );
        
        const [tasksCountRows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT group_id, COUNT(CASE WHEN completed = 0 THEN 1 END) as active_task_count
             FROM group_tasks
             WHERE group_id IN (${placeholders})
             GROUP BY group_id`,
            groupIds
        );

        const membersByGroupId = membersRows.reduce((acc: {[key: number]: GroupMember[]}, member) => {
            if (!acc[member.group_id]) acc[member.group_id] = [];
            acc[member.group_id].push({ id: member.id, name: member.name, avatarUrl: member.avatar_url, role: member.role });
            return acc;
        }, {});

        const tasksCountByGroupId = tasksCountRows.reduce((acc: {[key: number]: number}, count) => {
            acc[count.group_id] = parseInt(count.active_task_count, 10);
            return acc;
        }, {});
        
        const groups: Partial<NotebookGroup>[] = groupsRows.map(group => ({
            id: group.id,
            uuid: group.uuid,
            title: group.title,
            description: group.description,
            avatarUrl: group.avatar_url,
            createdAt: group.created_at,
            members: membersByGroupId[group.id] || [],
            tasks: [], // Tasks are not loaded in the list view for performance
            activeTaskCount: tasksCountByGroupId[group.id] || 0,
        }));

        return NextResponse.json({ success: true, groups });

    } catch (error: any) {
        console.error("GET ALL GROUPS ERROR: ", error);
        return NextResponse.json({ 
            success: false, 
            message: `Kesalahan server saat mengambil daftar grup: ${error.message}` 
        }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


// CREATE a new group
export async function POST(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    let connection;
    try {
        const body = await request.json();
        const validation = createGroupSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { uuid, title, description } = validation.data;
        
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [groupResult] = await connection.execute<ResultSetHeader>(
            'INSERT INTO note_groups (uuid, title, description, created_by) VALUES (?, ?, ?, ?)',
            [uuid, title, description || null, user.id]
        );
        const newGroupId = groupResult.insertId;

        // Add the creator as the first member (admin)
        await connection.execute<ResultSetHeader>(
            'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
            [newGroupId, user.id, 'admin']
        );

        await connection.commit();

        const newGroup: NotebookGroup = {
            id: newGroupId,
            uuid,
            title,
            description: description || null,
            createdBy: user.id,
            createdAt: new Date().toISOString(),
            members: [{ id: user.id, name: user.name, avatarUrl: user.avatar || null, role: 'admin' }],
            tasks: [], 
            activeTaskCount: 0,
        };
        
        return NextResponse.json({ success: true, message: 'Grup berhasil dibuat', group: newGroup }, { status: 201 });

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("CREATE GROUP ERROR: ", error);
        if (error.code === 'ER_DUP_ENTRY') {
             return NextResponse.json({ success: false, message: 'Gagal membuat grup, UUID duplikat.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

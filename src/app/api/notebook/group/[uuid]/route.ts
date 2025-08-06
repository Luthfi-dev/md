
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import type { NotebookGroup, GroupMember, GroupTask, GroupChecklistItem } from '@/types/notebook';

// GET a single group with all its details
export async function GET(request: NextRequest, { params }: { params: { uuid: string } }) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { uuid } = params;
    let connection;

    try {
        connection = await db.getConnection();
        
        // 1. Get group info and verify user is a member
        const [groupRows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT g.id, g.uuid, g.title, g.description, g.avatar_url, g.created_by, g.created_at
             FROM note_groups g
             JOIN group_members gm ON g.id = gm.group_id
             WHERE g.uuid = ? AND gm.user_id = ?`,
            [uuid, user.id]
        );

        if (groupRows.length === 0) {
            return NextResponse.json({ success: false, message: 'Grup tidak ditemukan atau Anda bukan anggota.' }, { status: 404 });
        }
        const groupData = groupRows[0];

        // 2. Get all members of the group
        const [memberRows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT u.id, u.name, u.avatar_url
             FROM users u
             JOIN group_members gm ON u.id = gm.user_id
             WHERE gm.group_id = ?`,
            [groupData.id]
        );
        const members: GroupMember[] = memberRows.map(row => ({
            id: row.id,
            name: row.name,
            avatarUrl: row.avatar_url,
        }));
        
        // 3. Get all tasks for the group
        const [taskRows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT t.id, t.uuid, t.label, t.completed, t.created_by,
                    GROUP_CONCAT(ta.user_id) as assigned_to_ids
             FROM group_tasks t
             LEFT JOIN group_task_assignees ta ON t.id = ta.task_id
             WHERE t.group_id = ?
             GROUP BY t.id`,
            [groupData.id]
        );
        
        // 4. Get all checklist items for all tasks in the group
        const [itemRows]: [RowDataPacket[], any] = await connection.execute(
            `SELECT ti.id, ti.label, ti.completed, ti.task_id
             FROM group_task_items ti
             JOIN group_tasks t ON ti.task_id = t.id
             WHERE t.group_id = ?`,
            [groupData.id]
        );

        // 5. Aggregate the data in JavaScript
        const itemsByTaskId: { [taskId: number]: GroupChecklistItem[] } = {};
        itemRows.forEach(item => {
            if (!itemsByTaskId[item.task_id]) {
                itemsByTaskId[item.task_id] = [];
            }
            itemsByTaskId[item.task_id].push({
                id: item.id,
                label: item.label,
                completed: !!item.completed,
            });
        });
        
        const tasks: GroupTask[] = taskRows.map(task => ({
            id: task.id,
            uuid: task.uuid,
            label: task.label,
            completed: !!task.completed,
            createdBy: task.created_by,
            assignedTo: task.assigned_to_ids ? task.assigned_to_ids.split(',').map(Number) : [],
            items: itemsByTaskId[task.id] || [],
        }));

        const group: NotebookGroup = {
            id: groupData.id,
            uuid: groupData.uuid,
            title: groupData.title,
            description: groupData.description,
            avatarUrl: groupData.avatar_url,
            createdBy: groupData.created_by,
            createdAt: groupData.created_at,
            members: members,
            tasks: tasks,
        };

        return NextResponse.json({ success: true, group });

    } catch (error: any) {
        console.error("GET GROUP DETAIL ERROR: ", error);
        return NextResponse.json({ 
            success: false, 
            message: `Kesalahan server saat mengambil detail grup: ${error.message}` 
        }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

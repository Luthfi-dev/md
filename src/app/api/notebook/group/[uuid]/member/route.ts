
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const addMemberSchema = z.object({
  email: z.string().email("Format email tidak valid."),
});

// Add a new member to a group
export async function POST(request: NextRequest, { params }: { params: { uuid: string } }) {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { uuid: groupUuid } = params;
    let connection;

    try {
        const body = await request.json();
        const validation = addMemberSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { email: newMemberEmail } = validation.data;

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Verify that the current user is an admin of the group
        const [adminRows]: [RowDataPacket[], any] = await connection.execute(
           `SELECT g.id FROM note_groups g
            JOIN group_members gm ON g.id = gm.group_id
            WHERE g.uuid = ? AND gm.user_id = ? AND gm.role = 'admin'`,
           [groupUuid, user.id]
        );

        if (adminRows.length === 0) {
            await connection.rollback();
            return NextResponse.json({ success: false, message: 'Grup tidak ditemukan atau Anda bukan admin.' }, { status: 403 });
        }
        const groupId = adminRows[0].id;

        // 2. Find the user to be added by their email
        const [userToAddRows]: [RowDataPacket[], any] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [newMemberEmail]
        );

        if (userToAddRows.length === 0) {
            await connection.rollback();
            return NextResponse.json({ success: false, message: 'Pengguna dengan email tersebut tidak ditemukan.' }, { status: 404 });
        }
        const userToAddId = userToAddRows[0].id;

        // 3. Check if the user is already a member
        const [existingMemberRows]: [RowDataPacket[], any] = await connection.execute(
            'SELECT user_id FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, userToAddId]
        );

        if (existingMemberRows.length > 0) {
            await connection.rollback();
            return NextResponse.json({ success: false, message: 'Pengguna ini sudah menjadi anggota grup.' }, { status: 409 });
        }
        
        // 4. Add the new member to the group
        await connection.execute<ResultSetHeader>(
            "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')",
            [groupId, userToAddId]
        );

        await connection.commit();
        
        return NextResponse.json({ success: true, message: 'Anggota berhasil ditambahkan.' });

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("ADD GROUP MEMBER ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

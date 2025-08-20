
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { ApiKeyManager } from '@/services/ApiKeyManager';
import { z } from 'zod';
import { decrypt } from '@/lib/encryption';

const apiKeySchema = z.object({
  service: z.enum(['gemini']),
  key: z.string().min(10, 'Kunci API tampaknya terlalu pendek'),
});

// GET all keys (previews only for security)
export async function GET(request: NextRequest) {
    const user = getAuthFromRequest(request);
    if (!user || user.role !== 1) { // Super Admin Only
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }

    try {
        const allKeys = await ApiKeyManager.readKeysFromFile();
        // Return decrypted keys with a preview
        const keysForAdmin = allKeys.map(k => ({
            ...k,
            key_preview: '...' + k.key.slice(-4),
        }));
        return NextResponse.json({ success: true, keys: keysForAdmin });
    } catch (error) {
        console.error("GET API KEYS ERROR: ", error);
        return NextResponse.json({ success: false, message: 'Kesalahan server saat mengambil kunci API.' }, { status: 500 });
    }
}

// CREATE a new key
export async function POST(request: NextRequest) {
    const user = getAuthFromRequest(request);
    if (!user || user.role !== 1) {
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }
    
    try {
        const body = await request.json();
        const validation = apiKeySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }
        
        const { service, key } = validation.data;
        
        const allKeys = await ApiKeyManager.readKeysFromFile();
        const newKey = {
            id: allKeys.length > 0 ? Math.max(...allKeys.map(k => k.id)) + 1 : 1,
            key,
            service,
            status: 'active' as const,
            failure_count: 0,
            last_used_at: null,
        };
        
        await ApiKeyManager.writeKeysToFile([...allKeys, newKey]);

        return NextResponse.json({ success: true, message: 'Kunci API berhasil ditambahkan', keyId: newKey.id }, { status: 201 });
    } catch (error: any) {
        console.error("CREATE API KEY ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    }
}

// DELETE a key
export async function DELETE(request: NextRequest) {
    const user = getAuthFromRequest(request);
    if (!user || user.role !== 1) {
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ success: false, message: 'ID Kunci API diperlukan' }, { status: 400 });
    }
    const keyId = parseInt(id, 10);

    try {
        const allKeys = await ApiKeyManager.readKeysFromFile();
        const keysAfterDeletion = allKeys.filter(k => k.id !== keyId);

        if (allKeys.length === keysAfterDeletion.length) {
            return NextResponse.json({ success: false, message: 'Kunci API tidak ditemukan.' }, { status: 404 });
        }
        
        await ApiKeyManager.writeKeysToFile(keysAfterDeletion);

        return NextResponse.json({ success: true, message: 'Kunci API berhasil dihapus.' });
    } catch (error: any) {
        console.error("DELETE API KEY ERROR: ", error);
        return NextResponse.json({ success: false, message: `Kesalahan server: ${error.message}` }, { status: 500 });
    }
}

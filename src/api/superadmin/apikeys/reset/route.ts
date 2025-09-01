
'use server';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { ApiKeyManager } from '@/services/ApiKeyManager';

// This is a new route to reset the failure count of an API key
export async function POST(request: NextRequest) {
    const user = await getAuthFromRequest(request);
    if (!user || user.role !== 1) { // Super Admin Only
        return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || isNaN(parseInt(id, 10))) {
        return NextResponse.json({ success: false, message: 'ID Kunci API tidak valid' }, { status: 400 });
    }
    
    const keyId = parseInt(id, 10);

    try {
        await ApiKeyManager.resetKeyFailureCount(keyId);
        // Force a refresh of the key cache
        await ApiKeyManager.fetchKeys(); 
        
        return NextResponse.json({ success: true, message: `Failure count for key ${keyId} has been reset.` });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}

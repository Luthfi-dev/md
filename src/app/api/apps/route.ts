
'use server';

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { AppDefinition } from '@/types/app';

export async function GET() {
    try {
        const jsonPath = path.join(process.cwd(), 'src', 'data', 'apps.json');
        const fileContents = await fs.readFile(jsonPath, 'utf-8');
        const items: AppDefinition[] = JSON.parse(fileContents);
        
        return NextResponse.json({ success: true, items });

    } catch (error) {
        console.error("API Error fetching apps: ", error);
        return NextResponse.json({ success: false, message: "Failed to fetch app list." }, { status: 500 });
    }
}

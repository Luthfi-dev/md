
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import type { AppDefinition } from '@/types/app';

// Define the Zod schema for a single AppDefinition
const AppDefinitionSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Judul tidak boleh kosong'),
    description: z.string().min(1, 'Deskripsi tidak boleh kosong'),
    href: z.string().min(1, 'URL tidak boleh kosong'),
    icon: z.string().min(1, 'Ikon tidak boleh kosong'),
    isPopular: z.boolean(),
    isNew: z.boolean(),
    order: z.number(),
});

// Define the schema for the entire array
const AppsConfigSchema = z.array(AppDefinitionSchema);

export async function saveAppsConfig(apps: AppDefinition[]) {
    // 1. Validate the incoming data against the schema
    const validationResult = AppsConfigSchema.safeParse(apps);

    if (!validationResult.success) {
        // Combine all errors into a single, user-friendly message
        const errorMessage = validationResult.error.errors.map(e => `Item dengan judul "${(e.path[1] as any)?.title || 'tidak diketahui'}" memiliki error: ${e.message}`).join('; ');
        throw new Error(`Data aplikasi tidak valid: ${errorMessage}`);
    }
    
    // 2. Define the path to the JSON file
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'apps.json');

    try {
        // 3. Convert the validated data to a formatted JSON string
        const jsonString = JSON.stringify(validationResult.data, null, 2);
        
        // 4. Write the string to the file
        await fs.writeFile(jsonPath, jsonString, 'utf-8');
        
        // Return a success message
        return { success: true, message: 'Konfigurasi aplikasi berhasil disimpan.' };

    } catch (error) {
        console.error('Gagal menyimpan konfigurasi aplikasi:', error);
        // Throw a new error to be caught by the client
        throw new Error('Gagal menulis data ke file di server.');
    }
}

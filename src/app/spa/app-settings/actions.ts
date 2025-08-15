
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// Define the schema for validation
const AppMetadataSchema = z.object({
  name: z.string().min(1, "Nama aplikasi tidak boleh kosong."),
  description: z.string().min(10, "Deskripsi harus lebih dari 10 karakter."),
  logoUrl: z.string().optional().or(z.literal('')),
});

export type AppMetadata = z.infer<typeof AppMetadataSchema>;

export async function saveAppSettings(settings: AppMetadata) {
  // 1. Validate the incoming data
  const validationResult = AppMetadataSchema.safeParse(settings);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors.map(e => e.message).join(' ');
    throw new Error(errorMessage);
  }

  const validatedSettings = validationResult.data;
  
  // 2. Define the path to the JSON file
  const jsonPath = path.join(process.cwd(), 'src', 'data', 'app-metadata.json');

  try {
    // 3. Convert the settings object to a formatted JSON string
    const jsonString = JSON.stringify(validatedSettings, null, 2);
    
    // 4. Write the string to the file
    await fs.writeFile(jsonPath, jsonString, 'utf-8');
    
    return { success: true, message: 'Pengaturan aplikasi berhasil disimpan.' };

  } catch (error) {
    console.error('Failed to save app settings:', error);
    throw new Error('Gagal menulis pengaturan ke file.');
  }
}

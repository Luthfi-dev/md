
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// Define the schema for validation
const AssistantSettingsSchema = z.object({
  name: z.string().min(1, "Nama asisten tidak boleh kosong."),
  systemPrompt: z.string().min(10, "System prompt harus lebih dari 10 karakter."),
  avatarUrl: z.string().url("URL avatar tidak valid.").optional().or(z.literal('')),
});

export type AssistantSettings = z.infer<typeof AssistantSettingsSchema>;

export async function saveAssistantSettings(settings: AssistantSettings) {
  // 1. Validate the incoming data
  const validationResult = AssistantSettingsSchema.safeParse(settings);
  if (!validationResult.success) {
    // Combine all errors into a single message
    const errorMessage = validationResult.error.errors.map(e => e.message).join(' ');
    throw new Error(errorMessage);
  }

  const validatedSettings = validationResult.data;
  
  // 2. Define the path to the JSON file
  // process.cwd() gives the root of the project
  const jsonPath = path.join(process.cwd(), 'data', 'assistant.json');

  try {
    // 3. Convert the settings object to a formatted JSON string
    const jsonString = JSON.stringify(validatedSettings, null, 2);
    
    // 4. Write the string to the file
    await fs.writeFile(jsonPath, jsonString, 'utf-8');
    
    // Return a success message (optional)
    return { success: true, message: 'Pengaturan berhasil disimpan.' };

  } catch (error) {
    console.error('Failed to save assistant settings:', error);
    // Throw a new error to be caught by the client
    throw new Error('Gagal menulis pengaturan ke file.');
  }
}

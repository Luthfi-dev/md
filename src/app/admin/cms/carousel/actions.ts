
'use server';
import { promises as fs } from 'fs';
import path from 'path';
import type { CarouselItem } from '@/types/app';
import { z } from 'zod';

const CarouselItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    href: z.string(),
    icon: z.string(),
    status: z.enum(['draft', 'published']),
});

const CarouselItemsSchema = z.array(CarouselItemSchema);

export async function saveCarouselItems(items: CarouselItem[]) {
    // Validate the incoming data against the schema
    const validationResult = CarouselItemsSchema.safeParse(items);

    if (!validationResult.success) {
        // Combine all errors into a single message
        const errorMessage = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Data carousel tidak valid: ${errorMessage}`);
    }

    const validatedItems = validationResult.data;

    // Define the path to the JSON file
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'carousel-items.json');

    try {
        // Convert the validated items object to a formatted JSON string
        const jsonString = JSON.stringify(validatedItems, null, 2);
        
        // Write the string to the file
        await fs.writeFile(jsonPath, jsonString, 'utf-8');
        
        return { success: true, message: 'Item carousel berhasil disimpan.' };

    } catch (error) {
        console.error('Gagal menyimpan item carousel:', error);
        // Throw a new error to be caught by the client
        throw new Error('Gagal menulis data carousel ke file.');
    }
}

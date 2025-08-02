
import { NextResponse, NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { optimizeImage } from '@/lib/image-optimizer';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const subfolder = data.get('subfolder') as string || '';

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file found' }, { status: 400 });
    }
    
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ success: false, message: 'File is not an image.' }, { status: 400 });
    }

    // --- Optimize image before saving ---
    const optimizedBuffer = await optimizeImage(await file.arrayBuffer(), 1024, 0.85);

    // --- Directory and Path Handling ---
    const targetDir = path.join(UPLOADS_DIR, subfolder);
    await mkdir(targetDir, { recursive: true });

    const fileExtension = path.extname(file.name) || '.jpg';
    const uniqueFilename = `${Date.now()}-${Math.floor(Math.random() * 1E9)}${fileExtension}`;
    const filePath = path.join(targetDir, uniqueFilename);

    // --- Write file to server ---
    await writeFile(filePath, Buffer.from(optimizedBuffer));

    // Return the relative path to be stored in the database
    const relativePath = path.join(subfolder, uniqueFilename).replace(/\\/g, '/');
    
    return NextResponse.json({ success: true, filePath: relativePath });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json({ success: false, message: 'Something went wrong.' }, { status: 500 });
  }
}

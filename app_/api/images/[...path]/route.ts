
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import mime from 'mime-types';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filePathParts = params.path;
  if (!filePathParts || filePathParts.length === 0) {
    return new NextResponse('File not found', { status: 404 });
  }

  // Sanitize the file path to prevent directory traversal attacks
  const relativePath = path.normalize(path.join(...filePathParts));
  if (relativePath.startsWith('..')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const absolutePath = path.join(UPLOADS_DIR, relativePath);

  try {
    const fileBuffer = await readFile(absolutePath);
    const mimeType = mime.lookup(absolutePath) || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File not found
      return new NextResponse('File not found', { status: 404 });
    }
    // Other errors
    console.error(`Error reading file: ${absolutePath}`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

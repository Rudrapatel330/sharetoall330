import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { generateUniqueCode, saveFileMetadata, UPLOADS_DIR } from '../../../utils/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const code = generateUniqueCode();
    
    // Save file
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${code}_${safeFilename}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    
    fs.writeFileSync(filePath, buffer);
    
    // Save metadata
    saveFileMetadata(code, {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      filePath: filePath,
      uploadedAt: new Date().toISOString()
    });

    return NextResponse.json({ code, message: 'File uploaded successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error during upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

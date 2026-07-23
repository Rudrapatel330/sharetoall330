import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const code = generateCode();
    
    // Upload directly to Vercel Blob
    const blob = await put(`${code}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: false, // We rely on our 6-digit code for uniqueness in this simple setup
    });

    return NextResponse.json({ code, message: 'File uploaded successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error during upload:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

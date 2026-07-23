import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload directly to file.io
    const fileIoFormData = new FormData();
    fileIoFormData.append('file', file);
    
    // Setting autoDelete=true is the default, but we can be explicit
    // Set expires=1d just in case, though it deletes on first download
    const response = await fetch('https://file.io/?expires=1d', {
      method: 'POST',
      body: fileIoFormData,
    });

    if (!response.ok) {
      throw new Error(`file.io responded with ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('file.io upload failed');
    }

    // The key is the code (e.g. "qY7xR4w")
    const code = data.key;

    return NextResponse.json({ code, message: 'File uploaded successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error during upload:', error);
    return NextResponse.json({ error: 'Upload failed due to network error' }, { status: 500 });
  }
}

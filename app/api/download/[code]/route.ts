import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const code = (await params).code;
  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  try {
    // Find the file by checking the prefix
    const { blobs } = await list({ prefix: `${code}-` });
    
    if (blobs.length === 0) {
      return NextResponse.json({ error: 'Invalid code or file not found' }, { status: 404 });
    }

    const blob = blobs[0];
    
    // Check if the file is older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (new Date(blob.uploadedAt) < oneHourAgo) {
      // File has expired, delete it now
      try {
        await del(blob.url);
      } catch (e) {
        console.error("Failed to delete expired file:", e);
      }
      return NextResponse.json({ error: 'File has expired (older than 1 hour)' }, { status: 410 });
    }
    
    // Extract the original filename by removing the code prefix
    const filename = blob.pathname.substring(code.length + 1);

    // Fetch the file from the blob URL
    const response = await fetch(blob.url);
    if (!response.ok) {
      throw new Error('Failed to fetch from blob storage');
    }
    
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Type': contentType,
        'Content-Length': blob.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error during download:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}

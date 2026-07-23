import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

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
    
    // Extract the original filename by removing the code prefix
    const filename = blob.pathname.substring(code.length + 1);

    // Fetch the file from the blob URL
    const response = await fetch(blob.url);
    if (!response.ok) {
      throw new Error('Failed to fetch from blob storage');
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Type': blob.contentType || 'application/octet-stream',
        'Content-Length': blob.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error during download:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getFileMetadata } from '../../../../utils/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const code = (await params).code;
  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  const metadata = getFileMetadata(code);
  if (!metadata) {
    return NextResponse.json({ error: 'Invalid code or file not found' }, { status: 404 });
  }

  if (!fs.existsSync(metadata.filePath)) {
    return NextResponse.json({ error: 'File missing on server' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(metadata.filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata.fileName)}"`,
      'Content-Type': metadata.mimeType,
      'Content-Length': metadata.size.toString(),
    },
  });
}

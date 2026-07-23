import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export async function GET(request: Request) {
  try {
    let hasMore = true;
    let cursor: string | undefined = undefined;
    let deletedCount = 0;

    // 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    while (hasMore) {
      const result = await list({ cursor });
      
      for (const blob of result.blobs) {
        if (new Date(blob.uploadedAt) < oneHourAgo) {
          await del(blob.url);
          deletedCount++;
        }
      }
      
      hasMore = result.hasMore;
      cursor = result.cursor;
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Cleanup job error:', error);
    return NextResponse.json({ error: 'Failed to run cleanup' }, { status: 500 });
  }
}

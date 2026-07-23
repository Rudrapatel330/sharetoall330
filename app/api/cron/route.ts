import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export async function GET() {
  try {
    let hasMore = true;
    let currentCursor: string | undefined = undefined;
    let deletedCount = 0;

    // 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    while (hasMore) {
      const result: any = await list({ cursor: currentCursor });
      
      for (const blob of result.blobs) {
        if (new Date(blob.uploadedAt) < oneHourAgo) {
          await del(blob.url);
          deletedCount++;
        }
      }
      
      hasMore = result.hasMore;
      currentCursor = result.cursor;
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Cleanup job error:', error);
    return NextResponse.json({ error: 'Failed to run cleanup' }, { status: 500 });
  }
}

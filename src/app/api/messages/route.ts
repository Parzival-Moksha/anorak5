import { NextResponse } from 'next/server';
import { getRecentMessages, appendMessage } from '@/lib/db';
import { logger } from '@/app/utils/logger';

// Ensure this is server-side only
if (typeof window !== 'undefined') {
  throw new Error('This module can only be used server-side');
}

export async function GET() {
  try {
    const messages = await getRecentMessages();
    return NextResponse.json({ messages });
  } catch (err) {
    const error = err as Error;
    logger.error('Failed to fetch messages', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const message = await request.json();
    await appendMessage(message);
    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as Error;
    logger.error('Failed to save message', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
} 
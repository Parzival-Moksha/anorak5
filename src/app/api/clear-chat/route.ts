import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { logger } from '@/app/utils/logger';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);

export async function POST() {
  try {
    // Archive current messages before deletion (optional but recommended)
    const currentMessages = await sql`SELECT * FROM messages ORDER BY timestamp`;
    
    if (currentMessages.length > 0) {
      await sql`
        INSERT INTO chat_archives (archive_date, messages)
        VALUES (NOW(), ${JSON.stringify(currentMessages)})
      `;
    }

    // Clear all messages from the messages table
    await sql`TRUNCATE TABLE messages`;

    logger.info('Chat history cleared successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to clear chat history:', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear chat history' },
      { status: 500 }
    );
  }
} 
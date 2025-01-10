// This file should only be imported by API routes
import { neon } from '@neondatabase/serverless';
import { logger } from '@/app/utils/logger';

if (typeof window !== 'undefined') {
  throw new Error('This module can only be used server-side');
}

const sql = neon(process.env.DATABASE_URL!);

export interface StoredMessage {
  timestamp: string;
  walletAddress: string;
  query: string;
  response: string;
}

export async function getRecentMessages(): Promise<StoredMessage[]> {
  try {
    const messages = await sql`
      SELECT timestamp::text, wallet_address, query, response
      FROM messages 
      ORDER BY timestamp ASC 
      LIMIT 20
    `;
    return messages as StoredMessage[];
  } catch (err) {
    const error = err as Error;
    logger.error('Database error fetching messages:', error);
    throw error;
  }
}

export async function appendMessage(message: StoredMessage): Promise<void> {
  try {
    await sql`
      INSERT INTO messages (
        timestamp,
        wallet_address,
        query,
        response
      ) VALUES (
        CURRENT_TIMESTAMP,
        ${message.walletAddress},
        ${message.query},
        ${message.response}
      )
    `;
  } catch (err) {
    const error = err as Error;
    logger.error('Database error appending message:', error);
    throw error;
  }
}

export async function ensureArchiveTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS chat_archives (
        id SERIAL PRIMARY KEY,
        archive_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        messages JSONB
      )
    `;
    logger.info('Archive table verified/created');
  } catch (error) {
    logger.error('Failed to create archive table:', error as Error);
    throw error;
  }
} 
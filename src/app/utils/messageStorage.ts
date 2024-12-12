import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

// Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const sql = neon(process.env.DATABASE_URL);

const MAX_MESSAGES = 20;

interface StoredMessage {
  timestamp: string;
  walletAddress: string;
  query: string;
  response: string;
}

// First time setup - create the messages table
export async function setupDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        wallet_address TEXT NOT NULL,
        query TEXT NOT NULL,
        response TEXT NOT NULL
      );
    `;
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

export async function appendMessage(message: StoredMessage) {
  try {
    await sql`
      INSERT INTO messages (timestamp, wallet_address, query, response)
      VALUES (${message.timestamp}, ${message.walletAddress}, ${message.query}, ${message.response});
    `;
  } catch (error) {
    console.error('Error saving message:', error);
  }
}

export async function getRecentMessages(): Promise<StoredMessage[]> {
  try {
    const messages = await sql<StoredMessage[]>`
      SELECT 
        timestamp::text,
        wallet_address as "walletAddress",
        query,
        response
      FROM messages 
      ORDER BY timestamp DESC 
      LIMIT ${MAX_MESSAGES};
    `;
    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error reading messages:', error);
    return [];
  }
}

// Update test function to just verify connection
export async function testDatabaseConnection() {
  try {
    const result = await sql`SELECT NOW();`;
    console.log('Database connection successful:', result);

    await setupDatabase();
    console.log('Database table created/verified');

    return true;
  } catch (err) {
    const error = err as Error;
    console.error('Database test failed:', error.message);
    return false;
  }
} 
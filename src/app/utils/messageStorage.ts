import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { logger } from './logger';
import { createDatabaseError } from './errors';
import 'dotenv/config';

let sql: NeonQueryFunction<false, false>;
let cachedMessages: StoredMessage[] = [];
let isInitialized = false;

try {
  if (!process.env.DATABASE_URL) {
    throw createDatabaseError('DATABASE_URL is not defined in environment variables');
  }
  sql = neon(process.env.DATABASE_URL);
} catch (err) {
  const error = err as Error;
  logger.error('Failed to initialize database connection:', error);
  throw error;
}

const MAX_MESSAGES = 20;

interface StoredMessage {
  timestamp: string;
  walletAddress: string;
  query: string;
  response: string;
}

interface DatabaseMessage {
  timestamp: string;
  wallet_address: string;
  query: string;
  response: string;
}

// First time setup - create the messages table and load messages
export async function setupDatabase() {
  if (isInitialized) return;
  
  try {
    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        wallet_address TEXT NOT NULL,
        query TEXT NOT NULL,
        response TEXT NOT NULL
      );
    `;

    // Load all messages into cache
    await loadAllMessages();
    
    isInitialized = true;
    logger.info('Database setup complete and messages loaded');
  } catch (err) {
    const error = err as Error;
    logger.error('Error setting up database:', error);
    throw error;
  }
}

// Add this to ensure database is initialized before any operations
async function ensureInitialized() {
  if (!isInitialized) {
    await setupDatabase();
  }
}

// New function to load all messages
async function loadAllMessages() {
  try {
    const result = await sql`
      SELECT 
        timestamp::text,
        wallet_address,
        query,
        response
      FROM messages 
      ORDER BY timestamp ASC;
    `;

    const messages = result as unknown as DatabaseMessage[];
    
    // Update cache with all messages
    cachedMessages = messages.map(msg => ({
      timestamp: msg.timestamp,
      walletAddress: msg.wallet_address,
      query: msg.query,
      response: msg.response
    }));

    logger.info(`Loaded ${cachedMessages.length} messages from database`);
  } catch (err) {
    const error = err as Error;
    logger.error('Error loading messages:', error);
    throw error;
  }
}

// Update getRecentMessages to use cache
export async function getRecentMessages(): Promise<StoredMessage[]> {
  await ensureInitialized();
  return cachedMessages.slice(-MAX_MESSAGES).reverse();
}

// Update appendMessage to update cache
export async function appendMessage(message: StoredMessage) {
  await ensureInitialized();
  try {
    await sql`
      INSERT INTO messages (timestamp, wallet_address, query, response)
      VALUES (${message.timestamp}, ${message.walletAddress}, ${message.query}, ${message.response});
    `;
    // Update cache
    cachedMessages.push(message);
    logger.info('Message added to database and cache');
  } catch (err) {
    const error = err as Error;
    logger.error('Error saving message:', error);
  }
}

// Update test function to just verify connection
export async function testDatabaseConnection() {
  try {
    const result = await sql`SELECT NOW();`;
    logger.info('Database connection successful');

    await setupDatabase();
    logger.info('Database table created/verified');

    return true;
  } catch (err) {
    const error = err as Error;
    logger.error('Database test failed:', error);
    return false;
  }
}
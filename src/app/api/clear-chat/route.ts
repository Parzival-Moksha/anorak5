import { neon } from '@neondatabase/serverless';

// Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const sql = neon(process.env.DATABASE_URL);

export async function POST() {
  try {
    // Get current timestamp for archive name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Create archive table with timestamp
    await sql`
      CREATE TABLE IF NOT EXISTS chat_archives (
        archive_id SERIAL PRIMARY KEY,
        archive_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        archive_name TEXT,
        messages JSONB
      )
    `;

    // Get current messages
    const currentMessages = await sql`SELECT * FROM messages ORDER BY timestamp`;

    // Store messages in archive
    await sql`
      INSERT INTO chat_archives (archive_name, messages)
      VALUES (
        ${`archive_${timestamp}`},
        ${JSON.stringify(currentMessages)}
      )
    `;

    // Clear current messages
    await sql`TRUNCATE TABLE messages`;

    return Response.json({ 
      success: true,
      archiveName: `archive_${timestamp}`,
      messageCount: currentMessages.length
    });
  } catch (error) {
    console.error('Error archiving chat:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to archive chat' 
    }, { 
      status: 500 
    });
  }
} 
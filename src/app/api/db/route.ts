import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Database connection is only available server-side
const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();
    
    switch (action) {
      case 'saveMessage':
        const { walletAddress, query, response } = data;
        // Use parameterized query to prevent SQL injection
        await sql`
          INSERT INTO messages (
            timestamp,
            wallet_address,
            query,
            response
          ) VALUES (
            NOW(),
            ${walletAddress},
            ${query},
            ${response}
          )
        `;
        return NextResponse.json({ success: true });

      case 'getMessages':
        const messages = await sql`
          SELECT * FROM messages 
          ORDER BY timestamp DESC 
          LIMIT 20
        `;
        return NextResponse.json({ messages });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Database operation failed' },
      { status: 500 }
    );
  }
} 
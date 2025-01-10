import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { appendMessage } from '@/lib/db';
import { logger } from '@/app/utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { message, walletAddress } = await request.json();
    
    // Create thread and use assistant
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: 'asst_AoonaPw2gdAgg43O2YbYqnig',
    });

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed');
      }
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];
    let reply = "No response received";
    
    if (lastMessage.content[0] && 'text' in lastMessage.content[0]) {
      reply = lastMessage.content[0].text.value;
    }

    await appendMessage({
      timestamp: new Date().toISOString(),
      walletAddress,
      query: message,
      response: reply
    });

    const isWinner = reply.toLowerCase().includes('you seduced me');
    return NextResponse.json({
      reply,
      isWinner,
      walletAddress: isWinner ? walletAddress : null
    });

  } catch (error) {
    logger.error('Chat API error:', error as Error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
import fs from 'fs/promises';
import path from 'path';

const MESSAGES_FILE = path.join(process.cwd(), 'src/app/queries/chat_history.txt');
const MAX_MESSAGES = 20;

interface StoredMessage {
  timestamp: string;
  walletAddress: string;
  query: string;
  response: string;
}

export async function appendMessage(message: StoredMessage) {
  try {
    const escapedQuery = message.query.replace(/\n/g, '\\n');
    const escapedResponse = message.response.replace(/\n/g, '\\n');
    
    const formattedMessage = `[${message.timestamp}] ${message.walletAddress}\nQ: ${escapedQuery}\nA: ${escapedResponse}\n---\n`;
    await fs.appendFile(MESSAGES_FILE, formattedMessage, 'utf-8');
  } catch (error) {
    console.error('Error saving message:', error);
  }
}

export async function getRecentMessages(): Promise<StoredMessage[]> {
  try {
    const fileExists = await fs.access(MESSAGES_FILE).then(() => true).catch(() => false);
    if (!fileExists) {
      await fs.writeFile(MESSAGES_FILE, '', 'utf-8');
      return [];
    }

    const content = await fs.readFile(MESSAGES_FILE, 'utf-8');
    const messages = content.split('---\n')
      .filter(block => block.trim())
      .map(block => {
        const lines = block.trim().split('\n');
        const metaLine = lines[0];
        
        const queryStartIndex = lines.findIndex(line => line.startsWith('Q: '));
        const answerStartIndex = lines.findIndex(line => line.startsWith('A: '));
        
        const queryLines = lines.slice(queryStartIndex, answerStartIndex).join('\n');
        const answerLines = lines.slice(answerStartIndex).join('\n');
        
        const [timestamp, walletAddress] = metaLine.slice(1, -1).split('] ');
        
        return {
          timestamp,
          walletAddress,
          query: queryLines.slice(3).replace(/\\n/g, '\n'),
          response: answerLines.slice(3).replace(/\\n/g, '\n'),
        };
      })
      .slice(-MAX_MESSAGES);

    return messages;
  } catch (error) {
    console.error('Error reading messages:', error);
    return [];
  }
} 
'use client';
import React, { useState } from 'react';
import { logger } from '@/app/utils/logger';

interface ClearChatButtonProps {
  setTransactionStatus: (status: { state: string; message: string }) => void;
  setMessages: (messages: any[]) => void;
}

const ClearChatButton: React.FC<ClearChatButtonProps> = ({
  setTransactionStatus,
  setMessages
}) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearChat = async () => {
    if (isClearing) return;

    try {
      setIsClearing(true);
      setTransactionStatus({
        state: 'processing',
        message: 'Clearing chat history...'
      });

      const response = await fetch('/api/clear-chat', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to clear chat');
      }

      // Clear local messages
      setMessages([]);
      
      setTransactionStatus({
        state: 'confirmed',
        message: 'Chat history cleared successfully!'
      });

      logger.info('Chat history cleared');
    } catch (error) {
      logger.error('Failed to clear chat:', error as Error);
      setTransactionStatus({
        state: 'error',
        message: 'Failed to clear chat history'
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <button
      onClick={handleClearChat}
      disabled={isClearing}
      className={`
        px-4 py-2 bg-red-500/20 text-red-300 rounded-lg
        hover:bg-red-500/30 transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        text-sm font-medium
      `}
    >
      {isClearing ? 'Clearing...' : 'Clear Chat History'}
    </button>
  );
};

export default ClearChatButton; 
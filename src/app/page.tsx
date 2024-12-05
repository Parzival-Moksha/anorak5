'use client';
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import confetti from 'canvas-confetti';
import '@solana/wallet-adapter-react-ui/styles.css';
import { useState, useEffect, useRef } from 'react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function Home() {
  const { publicKey } = useWallet();
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [detectedTrigger, setDetectedTrigger] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { connection } = useConnection();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

 const scanForTriggers = (message: string) => {
  if (message.toLowerCase().includes('you fucked sooka')) {
    setDetectedTrigger(true);
  }
};

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setTimeRemaining(3600);
    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      // Call the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();

      // Add AI response
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: data.reply,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      scanForTriggers(data.reply);
    } catch (error) {
      console.error('Error:', error);
      // Add error message
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: "Sorry, I couldn't process your request.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setTimeRemaining(3600);
    fireConfetti();
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const fireFireworks = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2
        }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2
        }
      });
    }, 250);
  };

  const fireSchoolPride = () => {
    const end = Date.now() + (5 * 1000);

    const colors = ['#bb0000', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const fireCannon = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF4500'],
      angle: randomInRange(55, 125)
    });
  };
  const sendSol = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first!');
      return;
    }
    
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey('E1j44YFzdtmMG2mjm1DFBJJKkVx7Y1Krk1WJs8pdhk9e'), // Replace this with your recipient wallet address
          lamports: LAMPORTS_PER_SOL * 0.1, // Sending 0.1 SOL
        })
      );
      
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      fireSchoolPride(); // Use existing animation
      console.log('Payment successful!');
    } catch (error) {
      console.error('Error:', error);
      alert('Payment failed! Check console for details.');
    }
  };
  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="absolute top-4 right-4">
        <WalletMultiButton />
      </div>
      
      {/* Chat Window */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                  w-[700px] h-[720px] bg-black/20 rounded-xl backdrop-blur-sm 
                  shadow-lg overflow-hidden border border-white/10 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-purple-500/50 ml-auto'
                    : 'bg-white/10'
                }`}
              >
                <p className="text-white">{message.content}</p>
                <p className="text-xs text-white/50 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-white/10 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Type your message..."
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-500 rounded-lg text-white hover:bg-purple-600 transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Transaction Monitor Window */}
     <div className="fixed right-4 top-1/2 -translate-y-[280px] w-[200px] 
                  bg-black/40 backdrop-blur-sm rounded-lg 
                  border border-white/10 p-4 flex items-center justify-center">
        <div className="text-center">
          {detectedTrigger ? (
            <div className="text-green-400">SUCCESS! SOOKA AND HER SECRET IS YOURS!</div>
          ) : (
            <div className="text-white/30">Secret unclaimed</div>
          )}
        </div>
      </div>

      {/* Timer and Buttons */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 bg-black/20 p-5 rounded-xl backdrop-blur-sm shadow-lg">
        <div className="text-center mb-2">
          <div className="text-4xl font-bold text-white mb-2 font-mono">
            {formatTime(timeRemaining)}
          </div>
        </div>

        <button 
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg
            transform transition-all duration-200 ease-in-out
            hover:scale-105 hover:shadow-lg hover:from-purple-600 hover:to-indigo-700
            active:scale-95 active:shadow-inner
            min-w-[170px] text-sm font-semibold
            border border-white/10 shadow-inner
            relative overflow-hidden group"
          onClick={resetTimer}
        >
          <span className="relative z-10">Reset Timer</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
        
        <button 
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg
            transform transition-all duration-200 ease-in-out
            hover:scale-105 hover:shadow-lg hover:from-emerald-600 hover:to-teal-700
            active:scale-95 active:shadow-inner
            min-w-[170px] text-sm font-semibold
            border border-white/10 shadow-inner
            relative overflow-hidden group"
          onClick={() => {
            console.log("I Won clicked");
            fireFireworks();
          }}
        >
          <span className="relative z-10">I Won</span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
        
        <button 
          className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg
            transform transition-all duration-200 ease-in-out
            hover:scale-105 hover:shadow-lg hover:from-rose-600 hover:to-pink-700
            active:scale-95 active:shadow-inner
            min-w-[170px] text-sm font-semibold
            border border-white/10 shadow-inner
            relative overflow-hidden group"
          onClick={() => {
            console.log("Payment initiated");
            sendSol();
          }}
        >
          <span className="relative z-10">I'm paying</span>
          <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
        
        <button 
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg
            transform transition-all duration-200 ease-in-out
            hover:scale-105 hover:shadow-lg hover:from-amber-600 hover:to-orange-700
            active:scale-95 active:shadow-inner
            min-w-[170px] text-sm font-semibold
            border border-white/10 shadow-inner
            relative overflow-hidden group"
          onClick={() => {
            console.log("I Sent a Message clicked");
            fireCannon();
          }}
        >
          <span className="relative z-10">I Sent a Message</span>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
      </div>
    </div>
  );
}
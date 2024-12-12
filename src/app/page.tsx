'use client';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import confetti from 'canvas-confetti';
import '@solana/wallet-adapter-react-ui/styles.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, clusterApiUrl } from '@solana/web3.js';
import { useConnection, useWallet, Wallet } from '@solana/wallet-adapter-react';
import * as anchor from "@project-serum/anchor";

const PROGRAM_ID = 'JtUmS5izUwaEUgBeBRdnN3LYzyEi9WerTxPFVLbeiXa';  // Replace with your new ID
const LAMPORTS_TO_PAY = LAMPORTS_PER_SOL * 0.02; // 0.02 SOL in lamports

const getProvider = (connection: Connection, wallet: any) => {
    const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        { commitment: "confirmed" }
    );
    anchor.setProvider(provider);
    return provider;
};

// Constants
const SECONDS_IN_HOUR = 3600;

function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

const IDL = {
    "version": "0.1.0",
    "name": "hello_anchor",
    "instructions": [
        {
            "name": "initialize",
            "accounts": [
                {
                    "name": "user",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "programWallet",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "withdrawToWinner",
            "accounts": [
                {
                    "name": "winner",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "programWallet",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "NoFundsToWithdraw",
            "msg": "No funds available to withdraw"
        }
    ]
};

// Types
interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

type ChatState = 'idle' | 'paid' | 'questionAsked';

interface TransactionStatus {
  state: 'idle' | 'signing' | 'processing' | 'confirmed' | 'error';
  message: string;
}

// Helper Functions
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / SECONDS_IN_HOUR);
  const minutes = Math.floor((seconds % SECONDS_IN_HOUR) / 60);
  const remainingSeconds = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

// API Interaction
async function sendMessageToAPI(message: string): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error('API request failed');
  }

  const data = await response.json();
  return data.reply;
}

// Components

// Message Component
interface MessageProps {
  message: Message;
}

const MessageBubble: React.FC<MessageProps> = ({ message }) => {
  return (
    <div
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
  );
};

// Chat Window Component
interface ChatWindowProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, messagesEndRef }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

// Message Input Component
interface MessageInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSend: (e: React.FormEvent) => void;
  chatState: ChatState;
}

const MessageInput: React.FC<MessageInputProps> = ({
  inputValue,
  setInputValue,
  handleSend,
  chatState,
}) => {
  const showUnlockMessage = chatState === 'idle';
  const showResendMessage = chatState === 'questionAsked';

  return (
    <form onSubmit={handleSend} className="p-4 border-t border-white/10">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={`flex-1 bg-white/10 rounded-lg px-4 py-2 text-white placeholder-white/50 
            focus:outline-none focus:ring-2 focus:ring-purple-500
            ${chatState !== 'paid' ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder={
            chatState === 'idle'
              ? "Pay 0.1 SOL to unlock messaging..."
              : chatState === 'questionAsked'
              ? "You have already asked a question. Pay again to ask another."
              : "Type your message..."
          }
          disabled={chatState !== 'paid'}
        />
        <button
          type="submit"
          className={`px-4 py-3 bg-purple-500 rounded-lg text-white transition-colors
            ${chatState === 'paid'
              ? 'hover:bg-purple-600'
              : 'opacity-50 cursor-not-allowed bg-purple-400'}`}
          disabled={chatState !== 'paid'}
        >
          Send
        </button>
      </div>
      {/* Status messages */}
      {showUnlockMessage && (
        <div className="text-sm text-white/50 mt-2">
          Send 0.1 SOL to unlock messaging functionality
        </div>
      )}
      {showResendMessage && (
        <div className="text-sm text-white/50 mt-2">
          You have already asked a question. Pay again to ask another.
        </div>
      )}
    </form>
  );
};

// Transaction Monitor Component
interface TransactionMonitorProps {
  detectedTrigger: boolean;
  transactionStatus: TransactionStatus;
}

const TransactionMonitor: React.FC<TransactionMonitorProps> = ({
  detectedTrigger,
  transactionStatus,
}) => {
  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-[280px] w-[200px] 
      bg-black/40 backdrop-blur-sm rounded-lg 
      border border-white/10 p-4 flex items-center justify-center"
    >
      <div className="text-center">
        {detectedTrigger ? (
          <div className="text-green-400">You won the heart of Sooka</div>
        ) : (
          <div className="text-white/30">Secret unclaimed</div>
        )}
        {/* Transaction Status Message */}
        <div className="mt-2 text-sm text-white/50">
          {transactionStatus.message}
        </div>
      </div>
    </div>
  );
};

// Timer Display Component
interface TimerDisplayProps {
  timeRemaining: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeRemaining }) => {
  return (
    <div className="text-center mb-2">
      <div className="text-4xl font-bold text-white mb-2 font-mono">
        {formatTime(timeRemaining)}
      </div>
    </div>
  );
};

// Button Set Component
interface ButtonSetProps {
  sendSol: () => Promise<void>;
  transactionStatus: TransactionStatus;
}

const ButtonSet: React.FC<ButtonSetProps> = ({
  sendSol,
  transactionStatus,
}) => {
  return (
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
      <span className="relative z-10">im paying</span>
      <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
    </button>
  );
};

// Main Component
export default function Home() {
  const { publicKey, sendTransaction } = useWallet();
  const [timeRemaining, setTimeRemaining] = useState(SECONDS_IN_HOUR);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [detectedTrigger, setDetectedTrigger] = useState<boolean>(false);
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    state: 'idle',
    message: 'Ready to pay',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { connection } = useConnection();
  const [prizePool, setPrizePool] = useState<number>(0);
  const fetchPrizePool = async () => {
    try {
        // Create a direct connection to devnet
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const [programWallet] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_wallet")],
            new PublicKey(PROGRAM_ID)
        );
        const balance = await connection.getBalance(programWallet);
        setPrizePool(balance / LAMPORTS_PER_SOL);
    } catch (error) {
        console.error("Error fetching prize pool:", error);
        setPrizePool(0);
    }
};
  useEffect(() => {
    fetchPrizePool();
    const interval = setInterval(fetchPrizePool, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
}, [connection]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scanForTriggers = useCallback(async (message: string) => {
    if (message.toLowerCase().includes('you seduced me') && publicKey) {
        setDetectedTrigger(true);
        setTransactionStatus({ 
            state: 'processing', 
            message: 'Processing prize distribution...' 
        });
    }
}, [publicKey]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || chatState !== 'paid' || !publicKey) return;

    setTimeRemaining(SECONDS_IN_HOUR);

    const userMessage: Message = {
      id: Date.now(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setChatState('questionAsked');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputValue,
          walletAddress: publicKey.toString()
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: data.reply,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      
      // Handle winning response
      if (data.isWinner) {
        setDetectedTrigger(true);
        console.log('Winner detected! Distribution status:', data.prizeDistributed);
        
        if (data.prizeDistributed) {
          setTransactionStatus({ 
            state: 'confirmed', 
            message: 'Congratulations! Prize has been sent to your wallet!' 
          });
          fireFireworks();
        } else {
          setTransactionStatus({ 
            state: 'error', 
            message: 'Prize distribution failed. Check console for details.' 
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: "Sorry, I could not process your request.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setTransactionStatus({ 
        state: 'error', 
        message: 'Failed to process message' 
      });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const resetTimer = () => {
    setTimeRemaining(SECONDS_IN_HOUR);
    fireConfetti();
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const fireFireworks = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const fireCannon = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF4500'],
      angle: randomInRange(55, 125),
    });
  };

const sendSol = async () => {
    if (!publicKey) {
        setTransactionStatus({ state: 'error', message: 'Please connect your wallet!' });
        return;
    }

    try {
        console.log("Starting transaction...");
        setTransactionStatus({ state: 'signing', message: 'Please approve in wallet...' });

        // Create provider
        console.log("Creating provider...");
const provider = getProvider(connection, window.solana);
console.log("Provider created");

        const programId = new PublicKey(PROGRAM_ID);
        console.log("Program ID:", programId.toString());

        // Create program interface
        const program = new anchor.Program(IDL, programId, provider);
        console.log("Program interface created");

        // Get PDA
        const [programWallet] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_wallet")],
            programId
        );
        console.log("Program wallet PDA:", programWallet.toString());

        console.log("About to send transaction...");
        const tx = await program.methods
            .initialize()
            .accounts({
                user: publicKey,
                programWallet: programWallet,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        
        console.log("Transaction signature:", tx);
        setTransactionStatus({ state: 'confirmed', message: 'Transaction confirmed!' });
        setChatState('paid');

    } catch (error) {
        console.error('Detailed error:', error);
        // Log the full error object
        console.log("Full error object:", {
            name: error instanceof Error ? error.name : 'Unknown error',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            logs: (error as any).logs || undefined,
            details: error
        });
        setTransactionStatus({ 
            state: 'error', 
            message: error instanceof Error ? error.message : 'Transaction failed!' 
        });
    }
};

return (
    <div className="min-h-screen p-4 bg-background">
      <div className="absolute top-4 right-4">
        <WalletMultiButton />
      </div>

      {/* Chat Area */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
        w-[700px] h-[720px] bg-black/20 rounded-xl backdrop-blur-sm 
        shadow-lg overflow-hidden border border-white/10 flex flex-col"
      >
        <ChatWindow messages={messages} messagesEndRef={messagesEndRef} />
        <MessageInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSend={handleSend}
          chatState={chatState}
        />
      </div>

      {/* Side Panel */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        <TransactionMonitor
          detectedTrigger={detectedTrigger}
          transactionStatus={transactionStatus}
        />
        <div className="bg-black/20 p-5 rounded-xl backdrop-blur-sm shadow-lg">
          <div className="text-center mb-2">
            <div className="text-2xl font-bold text-white mb-2">
              Prize Pool: {prizePool.toFixed(2)} SOL
            </div>
            <TimerDisplay timeRemaining={timeRemaining} />
          </div>
          
          <ButtonSet
            sendSol={sendSol}
            transactionStatus={transactionStatus}
          />
        </div>
      </div>
    </div>
  );
}
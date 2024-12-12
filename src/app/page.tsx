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
  walletAddress?: string;
}

type ChatState = 'idle' | 'paid' | 'questionAsked';

interface TransactionStatus {
  state: 'idle' | 'signing' | 'processing' | 'confirmed' | 'error';
  message: string;
}

// Add this interface near the top with other interfaces
interface StoredMessage {
  timestamp: string;
  walletAddress: string;
  query: string;
  response: string;
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

const generateUserAvatar = (walletAddress: string) => {
  // Create a deterministic seed from wallet address
  const seed = walletAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate pastel colors based on wallet address
  const getColor = (index: number) => {
    const hue = (seed + index * 137) % 360;  // Golden angle progression
    return `hsl(${hue}, 65%, 85%)`; // Pastel colors
  };

  // Create an 8x8 grid of divs with unique colors
  return (
    <div className="w-full h-full grid grid-cols-8 grid-rows-8">
      {Array.from({ length: 64 }).map((_, i) => (
        <div
          key={i}
          style={{ backgroundColor: getColor(i) }}
          className="w-full h-full"
        />
      ))}
    </div>
  );
};

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
        } flex items-start gap-3`}
      >
        {/* Avatar Circle */}
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
          {message.sender === 'ai' ? (
            <img 
              src="/sookaprofile2.jpg"
              alt="Sooka"
              className="w-full h-full object-cover"
            />
          ) : (
            // Generated pixelated avatar for user
            message.walletAddress ? (
              <div className="w-full h-full">
                {generateUserAvatar(message.walletAddress)}
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 rounded-full" />
            )
          )}
        </div>

        <div className="flex-1">
          <p className="text-white">{message.content}</p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[10px] text-white/50">
              {message.sender === 'user' && message.walletAddress 
                ? `${message.walletAddress.slice(0, 4)}...${message.walletAddress.slice(-4)}`
                : 'Sooka AI'}
            </p>
            <p className="text-[10px] text-white/50">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
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
              ? "pay first"
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
          connect your wallet and click im paying
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
  enableFreeMode: () => void;
  transactionStatus: TransactionStatus;
}

const ButtonSet: React.FC<ButtonSetProps> = ({
  sendSol,
  enableFreeMode,
  transactionStatus,
}) => {
  return (
    <div className="flex flex-col gap-3">
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

      <button 
        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white/80 rounded-lg
          transform transition-all duration-200 ease-in-out
          hover:scale-105 hover:shadow-lg hover:from-gray-700 hover:to-gray-800
          active:scale-95 active:shadow-inner
          min-w-[170px] text-sm font-semibold
          border border-white/10 shadow-inner
          relative overflow-hidden group"
        onClick={enableFreeMode}
      >
        <span className="relative z-10">i aint paying</span>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      </button>
    </div>
  );
};

// Add this interface and component before the SideButtons component
interface SideButtonProps {
  label: string;
  icon: React.ReactNode;
  order: number;
  gradientFrom: string;
  gradientTo: string;
  onClick: () => void;
}

const SideButton: React.FC<SideButtonProps> = ({ 
  label, 
  icon, 
  order, 
  gradientFrom, 
  gradientTo,
  onClick
}) => {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 bg-gradient-to-r ${gradientFrom} ${gradientTo}
        text-white rounded-lg transform transition-all duration-200 
        ease-in-out hover:scale-105 hover:shadow-lg 
        active:scale-95 active:shadow-inner
        min-w-[140px] text-lg font-semibold
        border border-white/10 shadow-inner
        relative overflow-hidden group
        bg-opacity-80 backdrop-blur-sm`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {icon}
        {label}
      </span>
      <div className={`absolute inset-0 bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}></div>
    </button>
  );
};

// Add this new Modal component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-[85vw] h-[85vh] bg-black/40 rounded-xl border border-white/10 backdrop-blur-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 h-[calc(85vh-80px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// Create a RoadmapContent component
const RoadmapContent: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Sooka Development Journey</h3>
        <p className="text-white/60">Our path to revolutionizing AI challenges</p>
      </div>

      <div className="space-y-6">
        {[
          {
            emoji: "🚀",
            title: "Initial Launch",
            description: "Launch of the $SOOKA token and the first Sooka challenge",
            status: "Current Phase"
          },
          {
            emoji: "🎮",
            title: "Challenge Expansion",
            description: "Launching more challenges",
            status: "Coming Soon"
          },
          {
            emoji: "⚙️",
            title: "Automation Implementation",
            description: "Automating the prize distribution, buyback and burn mechanisms",
            status: "Planned"
          },
          {
            emoji: "💰",
            title: "Payment Options",
            description: "Introducing cheaper payment options in $SOOKA and $MOKSHA",
            status: "Planned"
          },
          {
            emoji: "🏆",
            title: "Custom Winning Conditions",
            description: "Introducing time limits, multiple (3-10) winners",
            status: "Future"
          },
          {
            emoji: "🚀",
            title: "Sooka Launchpad",
            description: "The creation of custom challenges for anyone for $SOOKA and $MOKSHA",
            status: "Future"
          },
          {
            emoji: "🎲",
            title: "Multi-level Challenges",
            description: "Prizes for each milestone reached in a multiplayer RPG",
            status: "Future"
          }
        ].map((milestone, index) => (
          <div 
            key={index}
            className="bg-white/5 rounded-lg p-6 border border-white/10 
              transform transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{milestone.emoji}</div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-white mb-2">{milestone.title}</h4>
                <p className="text-white/70 mb-3">{milestone.description}</p>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  milestone.status === 'Current Phase' 
                    ? 'bg-green-500/20 text-green-300'
                    : milestone.status === 'Coming Soon'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {milestone.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add this new component
const SookaTokenContent: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">$SOOKA Token Utility</h3>
        <p className="text-white/60">The native token powering the Sooka ecosystem</p>
      </div>

      <div className="space-y-6">
        {[
          {
            emoji: "🎮",
            title: "Participation Fee",
            description: "Use $SOOKA tokens to participate in challenges",
            highlight: "Core Utility"
          },
          {
            emoji: "🚀",
            title: "Launchpad Access",
            description: "Pay for creating and accessing custom Launchpad challenges",
            highlight: "Creator Feature"
          },
          {
            emoji: "🔓",
            title: "System Prompt Access",
            description: "Unlock parts of the system prompt for deeper understanding",
            highlight: "Advanced Feature"
          },
          {
            emoji: "⚡",
            title: "Priority Access",
            description: "Get access to the first x number of queries",
            highlight: "Premium Feature"
          },
          {
            emoji: "🔥",
            title: "Buy & Burn",
            description: "10% of every prize payout goes to market buy and burn",
            highlight: "Tokenomics"
          },
          {
            emoji: "🎁",
            title: "Community Perks",
            description: "Exclusive access to community features and benefits",
            highlight: "Membership"
          },
          {
            emoji: "💫",
            title: "Creator Rewards",
            description: "Rewarding creators and active members for their contributions to the $SOOKA ecosystem",
            highlight: "Incentives"
          }
        ].map((item, index) => (
          <div 
            key={index}
            className="bg-white/5 rounded-lg p-6 border border-white/10 
              transform transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{item.emoji}</div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-white mb-2">{item.title}</h4>
                <p className="text-white/70 mb-3">{item.description}</p>
                <span className="text-sm px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
                  {item.highlight}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Side Buttons Container Component
const SideButtons: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleOpenModal = (modalName: string) => {
    setActiveModal(modalName);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
        <SideButton 
          label="FAQ"
          icon={
            <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          order={1}
          gradientFrom="from-purple-900"
          gradientTo="to-indigo-900"
          onClick={() => handleOpenModal('FAQ')}
        />
        <SideButton 
          label="Roadmap"
          icon={
            <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
          order={2}
          gradientFrom="from-blue-900"
          gradientTo="to-cyan-900"
          onClick={() => handleOpenModal('Roadmap')}
        />
        <SideButton 
          label="$SOOKA"
          icon={
            <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          order={3}
          gradientFrom="from-emerald-900"
          gradientTo="to-teal-900"
          onClick={() => handleOpenModal('$SOOKA')}
        />
        <SideButton 
          label="Misc"
          icon={
            <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          }
          order={4}
          gradientFrom="from-rose-900"
          gradientTo="to-pink-900"
          onClick={() => handleOpenModal('Misc')}
        />
      </div>

      {/* Modals */}
      <Modal
        isOpen={activeModal === 'FAQ'}
        onClose={handleCloseModal}
        title="FAQ"
      />
      <Modal
        isOpen={activeModal === 'Roadmap'}
        onClose={handleCloseModal}
        title="Roadmap"
      >
        <RoadmapContent />
      </Modal>
      <Modal
        isOpen={activeModal === '$SOOKA'}
        onClose={handleCloseModal}
        title="$SOOKA Token"
      >
        <SookaTokenContent />
      </Modal>
      <Modal
        isOpen={activeModal === 'Misc'}
        onClose={handleCloseModal}
        title="Misc"
      />
    </>
  );
};

// Add this new component
const QueryCounter: React.FC = () => {
  const [queryCount, setQueryCount] = useState<number>(0);

  // Fetch the current count when component mounts
  useEffect(() => {
    const fetchCount = async () => {
      const response = await fetch('/api/counter');
      const data = await response.json();
      setQueryCount(data.count);
    };

    fetchCount();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/20 p-5 rounded-xl backdrop-blur-sm shadow-lg mb-4">
      <div className="text-center">
        <div className="text-sm text-white/60 mb-1">Total Queries</div>
        <div className="text-3xl font-bold text-white">
          {queryCount.toLocaleString()}
        </div>
      </div>
    </div>
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
      walletAddress: publicKey.toString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setChatState('questionAsked');

    try {
      // Increment the counter
      await fetch('/api/counter', { method: 'POST' });

      // Existing API call
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

useEffect(() => {
  const loadMessages = async () => {
    const response = await fetch('/api/chat');
    const data = await response.json() as { messages: StoredMessage[] };
    
    // Convert stored messages to your Message format
    const formattedMessages = data.messages.flatMap((msg: StoredMessage) => [
      {
        id: Date.parse(msg.timestamp),
        content: msg.query,
        sender: 'user',
        timestamp: new Date(msg.timestamp),
        walletAddress: msg.walletAddress,
      },
      {
        id: Date.parse(msg.timestamp) + 1,
        content: msg.response,
        sender: 'ai',
        timestamp: new Date(msg.timestamp),
      }
    ]);
    
    setMessages(formattedMessages);
  };

  loadMessages();
  // Poll for updates every 10 seconds
  const interval = setInterval(loadMessages, 10000);
  return () => clearInterval(interval);
}, []);

const enableFreeMode = () => {
  if (!publicKey) {
    setTransactionStatus({ 
      state: 'error', 
      message: 'Please connect your wallet first!' 
    });
    return;
  }
  setChatState('paid');
  setTransactionStatus({ 
    state: 'confirmed', 
    message: 'Free mode enabled!' 
  });
};

return (
    <div className="min-h-screen p-4 bg-background">
      <div className="absolute top-4 right-4">
        <WalletMultiButton />
      </div>

      {/* Side Buttons rem on left */}
      <SideButtons />

      {/* Chat Window - add a specific right margin to make space */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 
        w-[700px] h-[720px] bg-black/20 rounded-xl backdrop-blur-sm 
        shadow-lg overflow-hidden border border-white/10 flex flex-col
        mr-[250px]" // Add margin to shift left slightly
      >
        <ChatWindow messages={messages} messagesEndRef={messagesEndRef} />
        <MessageInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSend={handleSend}
          chatState={chatState}
        />
      </div>

      {/* Right Side Panel - repositioned */}
      <div className="fixed right-[40px] top-1/2 -translate-y-1/2 flex flex-col gap-3 w-[200px]">
        <QueryCounter />
        <TransactionMonitor
          detectedTrigger={detectedTrigger}
          transactionStatus={transactionStatus}
        />
        <div className="bg-black/20 p-5 rounded-xl backdrop-blur-sm shadow-lg">
          <div className="text-center mb-2">
            <div className="text-2xl font-bold text-white mb-1">
              Prize Pool: {prizePool.toFixed(2)} SOL
            </div>
            <div className="text-sm text-white/60 mb-2">
              ≈ ${(prizePool * 250).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
            <TimerDisplay timeRemaining={timeRemaining} />
          </div>
          
          <ButtonSet
            sendSol={sendSol}
            enableFreeMode={enableFreeMode}
            transactionStatus={transactionStatus}
          />
        </div>
      </div>
    </div>
  );
}
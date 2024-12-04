'use client';
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const { publicKey } = useWallet();
  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="absolute top-4 right-4">
        <WalletMultiButton className="!bg-foreground !rounded-full" />
      </div>
      
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-black/20 p-4 rounded-lg backdrop-blur-sm">
        <button 
          className="px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/80 transition-colors min-w-[150px] text-sm font-medium"
          onClick={() => console.log("Reset Timer clicked")}
        >
          Reset Timer
        </button>
        
        <button 
          className="px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/80 transition-colors min-w-[150px] text-sm font-medium"
          onClick={() => console.log("I Won clicked")}
        >
          I Won
        </button>
        
        <button 
          className="px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/80 transition-colors min-w-[150px] text-sm font-medium"
          onClick={() => console.log("I Paid clicked")}
        >
          I Paid
        </button>
        
        <button 
          className="px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/80 transition-colors min-w-[150px] text-sm font-medium"
          onClick={() => console.log("I Sent a Message clicked")}
        >
          I Sent a Message
        </button>
      </div>
    </div>
  );
}
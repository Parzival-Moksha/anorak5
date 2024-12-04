'use client';
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const { publicKey } = useWallet();
  return (
    <div className="min-h-screen p-4">
      <div className="absolute top-4 right-4">
        <WalletMultiButton className="!bg-foreground !rounded-full" />
      </div>
    </div>
  );
}
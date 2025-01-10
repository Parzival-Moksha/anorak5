'use client';
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";

const PROGRAM_ID = 'JtUmS5izUwaEUgBeBRdnN3LYzyEi9WerTxPFVLbeiXa';

const IDL = {
  "version": "0.1.0",
  "name": "hello_anchor",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "programWallet", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "withdrawToWinner",
      "accounts": [
        { "name": "winner", "isMut": true, "isSigner": false },
        { "name": "programWallet", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    }
  ]
};

const AdminButton = () => {
  const { publicKey, signMessage } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const { connection } = useConnection();
  const [drainAddress, setDrainAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const authenticateAsAdmin = async () => {
    if (!publicKey || !signMessage) return;

    try {
      const message = `Admin authentication request ${Date.now()}`;
      const signature = await signMessage(new TextEncoder().encode(message));

      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          signature: Array.from(signature),
          publicKey: publicKey.toString()
        })
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('adminToken', token);
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Admin authentication failed:', error);
    }
  };

  const drainPool = async () => {
    if (!publicKey || !isAdmin || !drainAddress) return;
    
    try {
      setIsLoading(true);
      const provider = new anchor.AnchorProvider(connection, window.solana, { commitment: "confirmed" });
      const program = new anchor.Program(IDL, new PublicKey(PROGRAM_ID), provider);
      const [programWallet] = PublicKey.findProgramAddressSync(
        [Buffer.from("program_wallet")],
        new PublicKey(PROGRAM_ID)
      );

      const tx = await program.methods
        .withdrawToWinner()
        .accounts({
          winner: new PublicKey(drainAddress),
          programWallet: programWallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Drain transaction signature:", tx);
      alert('Pool drained successfully!');
    } catch (error) {
      console.error('Failed to drain pool:', error);
      alert('Failed to drain pool: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdmin) {
    return (
      <div className="admin-panel space-y-4 p-4 bg-black/20 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Admin Panel</h3>
        <div className="space-y-2">
          <label className="block text-sm text-white/70">Drain to Address:</label>
          <input
            type="text"
            value={drainAddress}
            onChange={(e) => setDrainAddress(e.target.value)}
            placeholder="Enter Solana address"
            className="w-full px-3 py-2 bg-black/30 rounded border border-white/10 text-white"
          />
        </div>
        <button 
          onClick={drainPool}
          disabled={isLoading || !drainAddress}
          className={`w-full px-4 py-2 rounded-lg ${isLoading ? 'bg-red-500/20 cursor-not-allowed' : 'bg-red-500/40 hover:bg-red-500/60'} text-white font-medium transition-colors`}
        >
          {isLoading ? 'Draining...' : 'Drain Pool'}
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={authenticateAsAdmin}
      className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
    >
      Authenticate as Admin
    </button>
  );
};

export default AdminButton; 
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";

// In-memory store for wallet-message pairs
interface MessageRecord {
  walletAddress: string;
  message: string;
  response: string;
  timestamp: number;
}

const messageStore: MessageRecord[] = [];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PROGRAM_ID = 'JtUmS5izUwaEUgBeBRdnN3LYzyEi9WerTxPFVLbeiXa';
const PRIZE_DISTRIBUTOR_PUBKEY = '9jcYddWQ3iwpnkLdM7GgGkLtSaTeG8T4ypEdZagU9kt';
const AUTHORITY_PUBKEY = 'CyFjkdDJ3LjD6ZktymLgUymhsW7tyy3oWifwsTx2j4nt';

// IDL definition
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
                    "name": "admin",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "authority",
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
    ]
};

async function distributePrize(winnerAddress: string) {
    console.log('\n=== Starting Prize Distribution Process ===');
    try {
        console.log('1. Creating Devnet connection...');
        const connection = new Connection(clusterApiUrl('devnet'));
        console.log('   ✓ Connection created');

        console.log('2. Reading private key from env...');
        const feePayerPrivateKey = process.env.PRIZE_DISTRIBUTOR_PRIVATE_KEY;
        if (!feePayerPrivateKey) {
            throw new Error('Prize distributor private key not found in .env');
        }
        console.log('   ✓ Private key found in env');

        console.log('3. Analyzing private key format:', {
            length: feePayerPrivateKey.length,
            containsCommas: feePayerPrivateKey.includes(','),
            firstFewChars: feePayerPrivateKey.substring(0, 20) + '...'
        });

        console.log('4. Creating Keypair from private key...');
        // Split the string into numbers and take only the first 64 values
        const numbers = feePayerPrivateKey.split(',').map(num => parseInt(num.trim()));
        if (numbers.length < 64) {
            throw new Error(`Private key too short: got ${numbers.length} bytes, need 64`);
        }
        const secretKey = new Uint8Array(numbers.slice(0, 64));
        console.log('   Parsed secret key length:', secretKey.length);
        
        const feePayer = Keypair.fromSecretKey(secretKey);
        console.log('   ✓ Keypair created with public key:', feePayer.publicKey.toBase58());
        
        if (feePayer.publicKey.toBase58() !== PRIZE_DISTRIBUTOR_PUBKEY) {
            throw new Error(`Public key mismatch. Expected: ${PRIZE_DISTRIBUTOR_PUBKEY}, Got: ${feePayer.publicKey.toBase58()}`);
        }
        console.log('   ✓ Public key verified');

        console.log('5. Setting up prize distribution...');
        console.log('   From:', feePayer.publicKey.toBase58());
        console.log('   To:', winnerAddress);

        console.log('6. Creating AnchorProvider...');
        const provider = new anchor.AnchorProvider(
            connection,
            {
                publicKey: feePayer.publicKey,
                signTransaction: async (tx) => {
                    console.log('   Signing transaction...');
                    tx.partialSign(feePayer);
                    return tx;
                },
                signAllTransactions: async (txs) => {
                    console.log('   Signing multiple transactions...');
                    txs.forEach(tx => tx.partialSign(feePayer));
                    return txs;
                },
            },
            { commitment: 'confirmed' }
        );
        console.log('   ✓ Provider created');

        console.log('7. Creating program interface...');
        const program = new anchor.Program(
            IDL,
            new PublicKey(PROGRAM_ID),
            provider
        );
        console.log('   ✓ Program interface created');

        console.log('8. Getting PDA address...');
        const [programWallet] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_wallet")],
            program.programId
        );
        console.log('   ✓ PDA address:', programWallet.toBase58());

        console.log('9. Checking PDA balance...');
        const pdaBalance = await connection.getBalance(programWallet);
        console.log('   PDA balance:', pdaBalance / 1e9, 'SOL');

        console.log('10. Building and sending transaction...');
        const tx = await program.methods
            .withdrawToWinner()
            .accounts({
                winner: new PublicKey(winnerAddress),
                admin: feePayer.publicKey,
                authority: new PublicKey(AUTHORITY_PUBKEY),
                programWallet: programWallet,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([feePayer])
            .rpc();

        console.log('    ✓ Transaction sent! Signature:', tx);
        
        console.log('11. Waiting for confirmation...');
        await connection.confirmTransaction(tx, 'confirmed');
        console.log('    ✓ Transaction confirmed!');

        console.log('\n=== Prize Distribution Successful! ===\n');
        return true;
    } catch (error) {
        console.error('\n=== Prize Distribution Failed! ===');
        
        // Type guard to check if error is an Error object
        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                // Type guard for Anchor error which might have logs
                logs: 'logs' in error ? (error as { logs?: string[] }).logs : undefined
            });
        } else {
            // If it's not an Error object, just log what we can
            console.error('Unknown error:', error);
        }
        
        return false;
    }
}

async function appendToLog(record: MessageRecord) {
  const logPath = path.join(process.cwd(), 'chat_logs.txt');
  const logEntry = `
[${new Date(record.timestamp).toISOString()}]
Wallet: ${record.walletAddress}
Query: ${record.message}
Response: ${record.response}
----------------------------------------
`;
  
  try {
    await fs.appendFile(logPath, logEntry, 'utf8');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

export async function POST(req: Request) {
  try {
    const { message, walletAddress } = await req.json();

    if (!message || !walletAddress) {
      return NextResponse.json(
        { error: 'Message and wallet address are required' },
        { status: 400 }
      );
    }

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

    const record: MessageRecord = {
      walletAddress,
      message,
      response: reply,
      timestamp: Date.now(),
    };

    messageStore.push(record);
    await appendToLog(record);

    if (messageStore.length > 1000) {
      messageStore.shift();
    }

    // Check if this is a winning response
    const isWinner = reply.toLowerCase().includes('you seduced me');
    
    // If winner, distribute prize
    let prizeDistributed = false;
    let distributionError = null;
    
    if (isWinner) {
        try {
            prizeDistributed = await distributePrize(walletAddress);
            if (!prizeDistributed) {
                distributionError = 'Prize distribution failed. Check server logs for details.';
            }
        } catch (error) {
            console.error('Prize distribution error:', error);
            distributionError = error instanceof Error ? error.message : 'Unknown error during prize distribution';
        }
    }
    
    return NextResponse.json({
        reply,
        isWinner,
        prizeDistributed,
        distributionError,
        walletAddress: isWinner ? walletAddress : null
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
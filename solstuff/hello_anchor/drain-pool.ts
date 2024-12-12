import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import * as dotenv from "dotenv";
import path from 'path';

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const AUTHORITY_PUBKEY = 'CyFjkdDJ3LjD6ZktymLgUymhsW7tyy3oWifwsTx2j4nt';

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
            "name": "drainPool",
            "accounts": [
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

async function main() {
    console.log('\n=== Starting Drain Process ===');
    try {
        // Setup connection
        console.log('1. Connecting to Devnet...');
        const connection = new Connection(clusterApiUrl('devnet'));
        console.log('   ✓ Connected');

        // Load admin keypair from environment variable
        console.log('\n2. Loading admin keypair...');
        const privateKey = process.env.PRIZE_DISTRIBUTOR_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("PRIZE_DISTRIBUTOR_PRIVATE_KEY not found in environment variables");
        }
        
        // Convert comma-separated string to Uint8Array
        const secretKey = new Uint8Array(
            privateKey.split(',').map(num => parseInt(num.trim())).slice(0, 64)
        );
        const adminKeypair = Keypair.fromSecretKey(secretKey);
        console.log('   ✓ Admin public key:', adminKeypair.publicKey.toBase58());

        // Setup provider
        console.log('\n3. Setting up Anchor provider...');
        const provider = new anchor.AnchorProvider(
            connection,
            new anchor.Wallet(adminKeypair),
            { commitment: "confirmed" }
        );
        console.log('   ✓ Provider ready');

        // Create program interface
        console.log('\n4. Creating program interface...');
        const programId = new PublicKey("JtUmS5izUwaEUgBeBRdnN3LYzyEi9WerTxPFVLbeiXa");
        const program = new anchor.Program(IDL, programId, provider);
        console.log('   ✓ Program interface created');

        // Get PDA
        console.log('\n5. Getting PDA address...');
        const [programWallet] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_wallet")],
            programId
        );
        console.log('   ✓ PDA address:', programWallet.toBase58());

        // Check balances before
        console.log('\n6. Checking balances before drain...');
        const balanceBefore = await connection.getBalance(programWallet);
        const adminBalanceBefore = await connection.getBalance(adminKeypair.publicKey);
        const authorityBalanceBefore = await connection.getBalance(new PublicKey(AUTHORITY_PUBKEY));
        console.log('   PDA balance:', balanceBefore / 1e9, 'SOL');
        console.log('   Admin balance:', adminBalanceBefore / 1e9, 'SOL');
        console.log('   Authority balance:', authorityBalanceBefore / 1e9, 'SOL');

        // Call drain_pool
        console.log('\n7. Calling drain_pool...');
        console.log('   Building transaction...');
        const tx = await program.methods
            .drainPool()
            .accounts({
                admin: adminKeypair.publicKey,
                authority: new PublicKey(AUTHORITY_PUBKEY),
                programWallet: programWallet,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([adminKeypair])
            .rpc();

        console.log('   ✓ Transaction sent! Signature:', tx);
        console.log('   Waiting for confirmation...');
        
        // Wait for confirmation
        await connection.confirmTransaction(tx, 'finalized');
        console.log('   ✓ Transaction confirmed!');

        // Wait a bit for state to settle
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check balances after with fresh connection
        console.log('\n8. Checking final balances...');
        const freshConnection = new Connection(clusterApiUrl('devnet'));
        const balanceAfter = await freshConnection.getBalance(programWallet);
        const adminBalanceAfter = await freshConnection.getBalance(adminKeypair.publicKey);
        const authorityBalanceAfter = await freshConnection.getBalance(new PublicKey(AUTHORITY_PUBKEY));
        console.log('   PDA balance:', balanceAfter / 1e9, 'SOL');
        console.log('   Admin balance:', adminBalanceAfter / 1e9, 'SOL');
        console.log('   Authority balance:', authorityBalanceAfter / 1e9, 'SOL');
        console.log('   Change in authority balance:', (authorityBalanceAfter - authorityBalanceBefore) / 1e9, 'SOL');

        console.log('\n=== Drain Process Complete ===\n');

    } catch (error) {
        console.error('\n=== Drain Process Failed! ===');
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
        });
        if ('logs' in error) {
            console.error('\nProgram Logs:');
            console.error(error.logs);
        }
    }
}

main(); 
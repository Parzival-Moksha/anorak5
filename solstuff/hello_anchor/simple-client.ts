import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

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
        }
    ]
};

async function main() {
    const connection = new Connection("https://api.devnet.solana.com");
    const wallet = new anchor.Wallet(Keypair.fromSecretKey(
        Buffer.from(JSON.parse(require('fs').readFileSync('/home/parzival/.config/solana/id.json', 'utf-8')))
    ));
    
    const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        { commitment: "confirmed" }
    );

    const programId = new PublicKey("BqNzK3t72vrMpUZGLPbjUCdSMiz6hWKU1emAQL5Gcrfk");
    const program = new anchor.Program(IDL, programId, provider);

    // Get PDA for program wallet
    const [programWallet] = PublicKey.findProgramAddressSync(
        [Buffer.from("program_wallet")],
        programId
    );

    try {
        const tx = await program.methods
            .initialize()
            .accounts({
                user: provider.wallet.publicKey,
                programWallet: programWallet,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        
        console.log("Transaction signature:", tx);
        
        // Check balances
        const balance = await connection.getBalance(provider.wallet.publicKey);
        console.log("Your wallet balance:", balance / 1e9, "SOL");
        
        const pdaBalance = await connection.getBalance(programWallet);
        console.log("PDA balance:", pdaBalance / 1e9, "SOL");
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
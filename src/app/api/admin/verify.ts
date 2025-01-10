import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import * as nacl from 'tweetnacl';

const ADMIN_WALLETS = process.env.ADMIN_WALLET_ADDRESSES?.split(',') || [];

export async function POST(request: Request) {
  try {
    const { message, signature, publicKey } = await request.json();
    
    // Check if wallet is admin
    if (!ADMIN_WALLETS.includes(publicKey)) {
      console.log('Unauthorized attempt from:', publicKey);  // For monitoring
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify signature using nacl
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = new Uint8Array(signature);
    const publicKeyBytes = new PublicKey(publicKey).toBytes();

    const verified = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Generate a simple session token (you might want to use a proper JWT library)
    const token = Buffer.from(
      `${publicKey}:${Date.now()}:${process.env.NEXTAUTH_SECRET || 'secret'}`
    ).toString('base64');
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
} 
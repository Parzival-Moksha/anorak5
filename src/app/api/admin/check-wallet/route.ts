import { NextResponse } from 'next/server';

export async function GET() {
  // Only return admin wallets in development environment
  if (process.env.NODE_ENV === 'development') {
    const adminWallets = process.env.ADMIN_WALLET_ADDRESSES?.split(',') || [];
    return NextResponse.json({ adminWallets });
  }
  
  return NextResponse.json(
    { error: 'Not available in production' },
    { status: 403 }
  );
} 
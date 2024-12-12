#!/bin/bash

# Check current PDA balance
echo "Current PDA balance:"
solana balance FsmYe3cRQ5JYgxenPCys6xM7fn2UoL9i7bbVAsfXn8Y5 --url devnet

# Call the drain function
echo -e "\nDraining pool..."
anchor build
anchor deploy

# Check final balances
echo -e "\nFinal balances:"
echo "PDA:"
solana balance FsmYe3cRQ5JYgxenPCys6xM7fn2UoL9i7bbVAsfXn8Y5 --url devnet
echo "Admin wallet (signer):"
solana balance 9jcYddWQ3iwpnkLdM7GgGkLtSaTeG8T4ypEdZagU9kt --url devnet
echo "Authority wallet (receiver):"
solana balance CyFjkdDJ3LjD6ZktymLgUymhsW7tyy3oWifwsTx2j4nt --url devnet 
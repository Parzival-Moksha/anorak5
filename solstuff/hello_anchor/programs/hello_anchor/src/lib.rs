use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("JtUmS5izUwaEUgBeBRdnN3LYzyEi9WerTxPFVLbeiXa");

#[program]
pub mod hello_anchor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let amount = 20_000_000; // 0.02 SOL in lamports
        
        // Transfer SOL from user to PDA
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.program_wallet.to_account_info(),
                },
            ),
            amount,
        )?;

        msg!("Transferred {} lamports!", amount);
        Ok(())
    }
	// New function to withdraw all funds to winner
    pub fn withdraw_to_winner(ctx: Context<WithdrawToWinner>) -> Result<()> {
        // Get the total amount in the PDA
        let total_amount = ctx.accounts.program_wallet.lamports();
        
        // Log the winner's address and amount
        msg!("Winner address: {}", ctx.accounts.winner.key());
        msg!("Sending prize amount: {}", total_amount);

        // Transfer all lamports from PDA to winner
        **ctx.accounts.program_wallet.try_borrow_mut_lamports()? = 0;
        **ctx.accounts.winner.try_borrow_mut_lamports()? += total_amount;

        msg!("Successfully sent {} lamports to winner!", total_amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"program_wallet"],
        bump
    )]
    pub program_wallet: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

// New struct for withdrawal
#[derive(Accounts)]
pub struct WithdrawToWinner<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"program_wallet"],
        bump
    )]
    pub program_wallet: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}
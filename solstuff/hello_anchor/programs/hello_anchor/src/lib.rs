use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("BqNzK3t72vrMpUZGLPbjUCdSMiz6hWKU1emAQL5Gcrfk");

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
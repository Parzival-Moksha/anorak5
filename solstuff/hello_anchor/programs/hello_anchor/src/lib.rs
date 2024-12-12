use anchor_lang::prelude::*;

declare_id!("JtUmS5izUwaEUgBeBRdnN3LYzyEi9WerTxPFVLbeiXa");

#[program]
pub mod hello_anchor {
    use super::*;
    use anchor_lang::system_program;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.program_wallet.to_account_info(),
                },
            ),
            20_000_000,
        )
    }

    pub fn withdraw_to_winner(ctx: Context<WithdrawToWinner>) -> Result<()> {
        let total = ctx.accounts.program_wallet.lamports();
        require!(total > 0, CustomError::NoFunds);
        let (_, bump) = Pubkey::find_program_address(&[b"program_wallet"], ctx.program_id);
        let winner_amount = (total as f64 * 0.7) as u64;
        let authority_amount = total - winner_amount;
        
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.program_wallet.to_account_info(),
                    to: ctx.accounts.winner.to_account_info(),
                },
                &[&[b"program_wallet".as_ref(), &[bump]]],
            ),
            winner_amount,
        )?;
        
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.program_wallet.to_account_info(),
                    to: ctx.accounts.authority.to_account_info(),
                },
                &[&[b"program_wallet".as_ref(), &[bump]]],
            ),
            authority_amount,
        )
    }

    pub fn drain_pool(ctx: Context<DrainPool>) -> Result<()> {
        let total = ctx.accounts.program_wallet.lamports();
        require!(total > 0, CustomError::NoFunds);
        let (_, bump) = Pubkey::find_program_address(&[b"program_wallet"], ctx.program_id);
        
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.program_wallet.to_account_info(),
                    to: ctx.accounts.authority.to_account_info(),
                },
                &[&[b"program_wallet".as_ref(), &[bump]]],
            ),
            total,
        )
    }
}

#[error_code]
pub enum CustomError {
    #[msg("Insufficient funds")]
    NoFunds,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"program_wallet"], bump)]
    pub program_wallet: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawToWinner<'info> {
    /// CHECK: Only receiving funds
    #[account(mut)]
    pub winner: UncheckedAccount<'info>,
    #[account(mut, constraint = admin.key() == ADMIN_PUBKEY)]
    pub admin: Signer<'info>,
    /// CHECK: Authority verified by constraint
    #[account(mut, constraint = authority.key() == AUTHORITY_PUBKEY)]
    pub authority: UncheckedAccount<'info>,
    #[account(mut, seeds = [b"program_wallet"], bump)]
    pub program_wallet: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DrainPool<'info> {
    #[account(mut, constraint = admin.key() == ADMIN_PUBKEY)]
    pub admin: Signer<'info>,
    /// CHECK: Authority verified by constraint
    #[account(mut, constraint = authority.key() == AUTHORITY_PUBKEY)]
    pub authority: UncheckedAccount<'info>,
    #[account(mut, seeds = [b"program_wallet"], bump)]
    pub program_wallet: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub const ADMIN_PUBKEY: Pubkey = pubkey!("9jcYddWQ3iwpnkLdM7GgGkLtSaTeG8T4ypEdZagU9kt");
pub const AUTHORITY_PUBKEY: Pubkey = pubkey!("CyFjkdDJ3LjD6ZktymLgUymhsW7tyy3oWifwsTx2j4nt");
use anchor_lang::prelude::*;

declare_id!("4PvSZDWfzTWD79EH9AG5L4RzcNH8tqxF5YCbksW5LirG");

pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod voting {
    use super::*;

    // initialize poll function
    pub fn initialize_poll(
        context: Context<InitializePoll>,
        poll_id: u32,
        description: String,
        start_time: u64,
        end_time: u64,
    ) -> Result<()> {
        msg!(
            "poll id {}'s, description: {}, start: {}, end: {}",
            poll_id,
            description,
            start_time,
            end_time
        );

        let poll = &mut context.accounts.polls;
        poll.poll_id = poll_id;
        poll.description = description;
        poll.start_time = start_time;
        poll.end_time = end_time;
        poll.candidate_amount = 0;

        Ok(())
    }

    pub fn initialize_candidate(
        context: Context<InitializeCandidate>,
        candidate_name: String,
        _poll_id: u32,
    ) -> Result<()> {
        let candidate = &mut context.accounts.candidates;
        let poll = &mut context.accounts.polls;
        candidate.candidate_name = candidate_name;
        candidate.voting_count = 0;
        poll.candidate_amount += 1;

        Ok(())
    }

    pub fn vote(context: Context<Vote>, _name: String, _poll_id: u32) -> Result<()> {
        let candidate = &mut context.accounts.candidates;
        candidate.voting_count += 1;

        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u32,
    #[max_len(200)]
    pub description: String,
    pub start_time: u64,
    pub end_time: u64,
    pub candidate_amount: u32,
}

#[derive(Accounts)]
#[instruction(poll_id:u32)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
    init,
    payer = signer,
    space = ANCHOR_DISCRIMINATOR_SIZE+Poll::INIT_SPACE,
    seeds = [poll_id.to_le_bytes().as_ref()],
    bump
    )]
    pub polls: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(32)]
    pub candidate_name: String,
    pub voting_count: u64,
}

#[derive(Accounts)]
#[instruction(candidate_name:String, poll_id:u32)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
    mut,
    seeds = [poll_id.to_le_bytes().as_ref()],
    bump
    )]
    pub polls: Account<'info, Poll>,

    #[account(
    init,
    payer = signer,
    space = ANCHOR_DISCRIMINATOR_SIZE+Candidate::INIT_SPACE,
    seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
    bump
    )]
    pub candidates: Account<'info, Candidate>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name:String,poll_id:u32)]
pub struct Vote<'info> {
    pub signer: Signer<'info>,

    #[account(
    seeds = [poll_id.to_le_bytes().as_ref()],
    bump
)]
    pub polls: Account<'info, Poll>,

    #[account(
    mut,
    seeds = [poll_id.to_le_bytes().as_ref(), name.as_bytes()],
    bump
)]
    pub candidates: Account<'info, Candidate>,
}

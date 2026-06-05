use crate::profile::ProfileContract;
use crate::types::{DataKey, Error, Giveaway, GiveawayStatus, ParticipantVerification};
use crate::utils::with_reentrancy_guard;
use soroban_sdk::{
    contract, contractevent, contractimpl, panic_with_error, token, Address, Env, String, Vec,
};

#[contract]
pub struct GiveawayContract;

#[contractevent]
pub struct GiveawayCreated {
    giveaway_id: u64,
    #[topic]
    creator: Address,
    token_address: Address,
    total_amount: i128,
    end_time: u64,
}

/// Emitted when a winner is definitively selected (`pick_winner`). Topics are fixed
/// `giveaway`, `winner`, plus the winner address; data is `[giveaway_id, prize_amount]`
/// as a Vec for downstream indexing (e.g. FCM).
#[contractevent(topics = ["giveaway", "winner"], data_format = "vec")]
pub struct GiveawayWinnerSelected {
    #[topic]
    winner: Address,
    giveaway_id: u64,
    prize_amount: i128,
}

#[allow(clippy::too_many_arguments)]
#[contractimpl]
impl GiveawayContract {
    #[allow(clippy::too_many_arguments)]
    pub fn create_giveaway(
        env: Env,
        creator: Address,
        token: Address,
        amount: i128,
        title: String,
        duration_seconds: u64,
        winner_count: u32,
        verification: Option<ParticipantVerification>,
    ) -> u64 {
        creator.require_auth();

        if winner_count == 0 {
            panic_with_error!(&env, Error::InvalidWinnerCount);
        }

        // Check if token is whitelisted
        let token_key = DataKey::AllowedToken(token.clone());
        let is_allowed: bool = env.storage().instance().get(&token_key).unwrap_or(false);

        if !is_allowed {
            panic_with_error!(&env, Error::TokenNotSupported);
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&creator, env.current_contract_address(), &amount);

        let giveaway_id = Self::generate_id(&env);
        let end_time = env.ledger().timestamp() + duration_seconds;

        let verification_type = match &verification {
            Some(v) if v.uses_reputation => 2,
            Some(_) => 1,
            None => 0,
        };
        let min_reputation = verification.as_ref().map(|v| v.min_reputation).unwrap_or(0);

        let giveaway = Giveaway {
            id: giveaway_id,
            creator: creator.clone(),
            token: token.clone(),
            amount,
            title,
            participant_count: 0,
            end_time,
            status: GiveawayStatus::Active,
            winner_count,
            winners: Vec::new(&env),
            verification_type,
            min_reputation,
        };

        if let Some(verification) = &verification {
            if !verification.uses_reputation {
                for addr in verification.allowlist.iter() {
                    env.storage().persistent().set(
                        &DataKey::GiveawayAllowlist(giveaway_id, addr.clone()),
                        &true,
                    );
                }
            }
        }

        env.storage()
            .persistent()
            .set(&DataKey::Giveaway(giveaway_id), &giveaway);

        GiveawayCreated {
            giveaway_id,
            creator,
            token_address: token,
            total_amount: amount,
            end_time,
        }
        .publish(&env);

        giveaway_id
    }

    pub fn enter_giveaway(env: Env, participant: Address, giveaway_id: u64) {
        participant.require_auth();

        let giveaway_key = DataKey::Giveaway(giveaway_id);
        let mut giveaway: Giveaway = env
            .storage()
            .persistent()
            .get(&giveaway_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::GiveawayNotFound));

        if giveaway.status != GiveawayStatus::Active {
            panic_with_error!(&env, Error::InvalidStatus);
        }
        if env.ledger().timestamp() > giveaway.end_time {
            panic_with_error!(&env, Error::GiveawayEnded);
        }

        let has_entered_key = DataKey::HasEntered(giveaway_id, participant.clone());
        if env.storage().persistent().has(&has_entered_key) {
            panic_with_error!(&env, Error::AlreadyEntered);
        }

        Self::verify_participant(&env, &giveaway, &participant);

        env.storage().persistent().set(&has_entered_key, &true);

        let index_key = DataKey::ParticipantIndex(giveaway_id, giveaway.participant_count);
        env.storage().persistent().set(&index_key, &participant);

        giveaway.participant_count += 1;
        env.storage().persistent().set(&giveaway_key, &giveaway);
    }

    fn verify_participant(env: &Env, giveaway: &Giveaway, participant: &Address) {
        match giveaway.verification_type {
            1 => {
                let allowed_key = DataKey::GiveawayAllowlist(giveaway.id, participant.clone());
                let authorized: bool = env
                    .storage()
                    .persistent()
                    .get(&allowed_key)
                    .unwrap_or(false);
                if !authorized {
                    panic_with_error!(&env, Error::UnauthorizedParticipant);
                }
            }
            2 => {
                let reputation = ProfileContract::get_reputation(env.clone(), participant.clone());
                if reputation < giveaway.min_reputation {
                    panic_with_error!(&env, Error::UnauthorizedParticipant);
                }
            }
            _ => {}
        }
    }

    pub fn pick_winner(env: Env, giveaway_id: u64) -> Address {
        let giveaway_key = DataKey::Giveaway(giveaway_id);
        let mut giveaway: Giveaway = env
            .storage()
            .persistent()
            .get(&giveaway_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::GiveawayNotFound));

        if giveaway.status != GiveawayStatus::Active {
            panic_with_error!(&env, Error::InvalidStatus);
        }
        if env.ledger().timestamp() <= giveaway.end_time {
            panic_with_error!(&env, Error::GiveawayStillActive);
        }
        if giveaway.participant_count == 0 {
            panic_with_error!(&env, Error::NoParticipants);
        }
        if giveaway.participant_count < giveaway.winner_count {
            panic_with_error!(&env, Error::InsufficientParticipants);
        }

        let random_seed = env.prng().gen::<u64>();
        let mut selected_indexes: Vec<u32> = Vec::new(&env);
        let mut winners: Vec<Address> = Vec::new(&env);

        let total = giveaway.participant_count;
        let target_count = giveaway.winner_count;

        for i in 0..target_count {
            let mut index = ((random_seed.wrapping_add(i as u64)) % total as u64) as u32;
            while {
                let mut duplicate = false;
                for picked in selected_indexes.iter() {
                    if picked == index {
                        duplicate = true;
                        break;
                    }
                }
                duplicate
            } {
                index = (index + 1) % total;
            }

            selected_indexes.push_back(index);

            let participant_key = DataKey::ParticipantIndex(giveaway_id, index);
            let winner_address: Address = env
                .storage()
                .persistent()
                .get(&participant_key)
                .unwrap_or_else(|| panic_with_error!(&env, Error::InvalidIndex));
            winners.push_back(winner_address.clone());

            // Publish the approximate prize share for each winner.
            let fee_key = DataKey::Fee;
            let fee_bps: u32 = env.storage().instance().get(&fee_key).unwrap_or(100);
            let fee_amount = giveaway
                .amount
                .checked_mul(fee_bps as i128)
                .and_then(|v| v.checked_div(10_000))
                .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow));
            let net_prize = giveaway
                .amount
                .checked_sub(fee_amount)
                .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow));
            let winner_count = target_count as i128;
            let base_prize = net_prize
                .checked_div(winner_count)
                .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow));
            let prize_amount = if i == 0 {
                net_prize
                    .checked_sub(
                        base_prize
                            .checked_mul(winner_count - 1)
                            .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow)),
                    )
                    .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow))
            } else {
                base_prize
            };

            GiveawayWinnerSelected {
                winner: winner_address.clone(),
                giveaway_id,
                prize_amount,
            }
            .publish(&env);
        }

        giveaway.winners = winners.clone();
        giveaway.status = GiveawayStatus::Claimable;
        env.storage().persistent().set(&giveaway_key, &giveaway);

        winners
            .first()
            .unwrap_or_else(|| panic_with_error!(&env, Error::NoParticipants))
    }

    pub fn distribute_prize(env: Env, giveaway_id: u64) {
        with_reentrancy_guard(&env, || {
            let giveaway_key = DataKey::Giveaway(giveaway_id);
            let mut giveaway: Giveaway = env
                .storage()
                .persistent()
                .get(&giveaway_key)
                .unwrap_or_else(|| panic_with_error!(&env, Error::GiveawayNotFound));

            if giveaway.status != GiveawayStatus::Claimable {
                panic_with_error!(&env, Error::InvalidStatus);
            }

            let winners = giveaway.winners.clone();
            if winners.is_empty() {
                panic_with_error!(&env, Error::NoParticipants);
            }

            // 1. Load 'fee_bps' from storage
            let fee_key = DataKey::Fee;
            let fee_bps: u32 = env.storage().instance().get(&fee_key).unwrap_or(100); // Default to 100 bps (1%)

            // 2. Calculate 'fee_amount' (fee_bps / 10000 * amount)
            let fee_amount = giveaway
                .amount
                .checked_mul(fee_bps as i128)
                .and_then(|v| v.checked_div(10_000))
                .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow));

            // Calculate net prize
            let net_prize = giveaway
                .amount
                .checked_sub(fee_amount)
                .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow));

            let winner_count = winners.len() as i128;
            let base_share = net_prize
                .checked_div(winner_count)
                .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow));

            let mut distributed = 0i128;
            let token_client = token::Client::new(&env, &giveaway.token);

            for (index, winner) in winners.iter().enumerate() {
                let mut prize_amount = base_share;
                if index == 0 {
                    let remainder =
                        net_prize
                            .checked_sub(base_share.checked_mul(winner_count - 1).unwrap_or_else(
                                || panic_with_error!(&env, Error::ArithmeticOverflow),
                            ))
                            .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow));
                    prize_amount = remainder;
                }
                distributed = distributed
                    .checked_add(prize_amount)
                    .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow));
                token_client.transfer(&env.current_contract_address(), winner, &prize_amount);
            }

            // 4. Add 'fee_amount' to CollectedFees storage counter
            let collected_fees_key = DataKey::CollectedFees(giveaway.token.clone());
            let current_fees: i128 = env
                .storage()
                .persistent()
                .get(&collected_fees_key)
                .unwrap_or(0);
            let new_fees = current_fees
                .checked_add(fee_amount)
                .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow));
            env.storage()
                .persistent()
                .set(&collected_fees_key, &new_fees);

            giveaway.status = GiveawayStatus::Completed;
            env.storage().persistent().set(&giveaway_key, &giveaway);

            // Increment creator's reputation — internal call, not user-accessible.
            ProfileContract::increment_reputation(&env, giveaway.creator.clone());
        })
    }

    pub fn init(env: Env, admin: Address, fee_bps: u32) {
        let admin_key = DataKey::Admin;

        // Check if already initialized
        if env.storage().instance().has(&admin_key) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }

        // Store admin address
        env.storage().instance().set(&admin_key, &admin);

        // Store fee basis points
        let fee_key = DataKey::Fee;
        env.storage().instance().set(&fee_key, &fee_bps);
    }

    fn generate_id(env: &Env) -> u64 {
        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::GiveawayCounter)
            .unwrap_or(0);
        counter += 1;
        env.storage()
            .instance()
            .set(&DataKey::GiveawayCounter, &counter);
        counter
    }

    /// Withdraw collected fees for a specific token - callable only by Admin
    /// Transfers all accumulated fees for the specified token to the admin address
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `token` - The token address to withdraw fees for
    ///
    /// # Panics
    /// Panics if called by non-admin address
    pub fn withdraw_fees(env: Env, token: Address) {
        // 1. Admin auth
        let admin_key = DataKey::Admin;
        let admin: Address = env
            .storage()
            .instance()
            .get(&admin_key)
            .expect("Admin not set");
        admin.require_auth();

        // 2. Read 'CollectedFees(token)' amount
        let collected_fees_key = DataKey::CollectedFees(token.clone());
        let fee_amount: i128 = env
            .storage()
            .persistent()
            .get(&collected_fees_key)
            .unwrap_or(0);

        // Only proceed if there are fees to withdraw
        if fee_amount > 0 {
            // 3. Transfer that amount to Admin
            let token_client = token::Client::new(&env, &token);
            token_client.transfer(&env.current_contract_address(), &admin, &fee_amount);

            // 4. Set 'CollectedFees(token)' to 0
            env.storage().persistent().set(&collected_fees_key, &0i128);
        }
    }
}

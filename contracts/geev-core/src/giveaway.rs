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

// ─── Dispute Events ─────────────────────────────────────────────────────────
#[contractevent]
pub struct GiveawayDisputed {
    giveaway_id: u64,
    raised_by: Address,
}

#[contractevent]
pub struct GiveawayResolved {
    giveaway_id: u64,
    release_funds: bool,
    resolver: Address,
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

        // ─── BLOCKED WHILE DISPUTED ──────────────────────────────────────────
        if giveaway.status == GiveawayStatus::Disputed {
            panic_with_error!(&env, Error::InvalidStatus);
        }
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
                    panic_with_error!(env, Error::UnauthorizedParticipant);
                }
            }
            2 => {
                let reputation = ProfileContract::get_reputation(env.clone(), participant.clone());
                if reputation < giveaway.min_reputation {
                    panic_with_error!(env, Error::UnauthorizedParticipant);
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

        // ─── BLOCKED WHILE DISPUTED ──────────────────────────────────────────
        if giveaway.status == GiveawayStatus::Disputed {
            panic_with_error!(&env, Error::InvalidStatus);
        }
        if giveaway.status != GiveawayStatus::Active {
            panic_with_error!(&env, Error::InvalidStatus);
        }
        if env.ledger().timestamp() <= giveaway.end_time {
            panic_with_error!(&env, Error::GiveawayStillActive);
        }
        if giveaway.participant_count == 0 {
            panic_with_error!(&env, Error::NoParticipants);
        }

        let winner = Self::select_winner(&env, giveaway_id, giveaway.participant_count);
        giveaway.winners.push_back(winner.clone());
        giveaway.status = GiveawayStatus::Claimable;
        env.storage().persistent().set(&giveaway_key, &giveaway);

        let prize = giveaway.amount / i128::from(giveaway.winner_count);

        GiveawayWinnerSelected {
            winner,
            giveaway_id,
            prize_amount: prize,
        }
        .publish(&env);

        winner
    }

    pub fn distribute_prize(env: Env, giveaway_id: u64) {
        let giveaway_key = DataKey::Giveaway(giveaway_id);
        let mut giveaway: Giveaway = env
            .storage()
            .persistent()
            .get(&giveaway_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::GiveawayNotFound));

        // ─── BLOCKED WHILE DISPUTED ──────────────────────────────────────────
        if giveaway.status == GiveawayStatus::Disputed {
            panic_with_error!(&env, Error::InvalidStatus);
        }
        if giveaway.status != GiveawayStatus::Claimable {
            panic_with_error!(&env, Error::InvalidStatus);
        }

        let token_client = token::Client::new(&env, &giveaway.token);
        let prize = giveaway.amount / i128::from(giveaway.winner_count);

        with_reentrancy_guard(&env, || {
            for winner in giveaway.winners.iter() {
                token_client.transfer(&env.current_contract_address(), &winner, &prize);
            }
        });

        giveaway.status = GiveawayStatus::Completed;
        env.storage().persistent().set(&giveaway_key, &giveaway);
    }

    fn select_winner(env: &Env, giveaway_id: u64, participant_count: u32) -> Address {
        let random_index = env.prng().gen_range(0..participant_count);
        let index_key = DataKey::ParticipantIndex(giveaway_id, random_index);
        env.storage()
            .persistent()
            .get(&index_key)
            .unwrap_or_else(|| panic_with_error!(env, Error::InvalidIndex))
    }

    fn generate_id(env: &Env) -> u64 {
        let counter_key = DataKey::GiveawayCounter;
        let current: u64 = env.storage().persistent().get(&counter_key).unwrap_or(0);
        let next = current + 1;
        env.storage().persistent().set(&counter_key, &next);
        next
    }

    // ─── DISPUTE FUNCTIONS ───────────────────────────────────────────────────

    /// Raise a dispute on a giveaway. Callable by the creator or any participant.
    /// Blocks winner selection and prize distribution until resolved by admin.
    pub fn dispute_giveaway(env: Env, giveaway_id: u64, caller: Address) {
        caller.require_auth();

        let giveaway_key = DataKey::Giveaway(giveaway_id);
        let mut giveaway: Giveaway = env
            .storage()
            .persistent()
            .get(&giveaway_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::GiveawayNotFound));

        if giveaway.status != GiveawayStatus::Active && giveaway.status != GiveawayStatus::Claimable
        {
            panic_with_error!(&env, Error::InvalidStatus);
        }

        let is_creator = giveaway.creator == caller;
        let is_participant: bool = env
            .storage()
            .persistent()
            .has(&DataKey::HasEntered(giveaway_id, caller.clone()));

        if !is_creator && !is_participant {
            panic_with_error!(&env, Error::NotAuthorizedResolver);
        }

        giveaway.status = GiveawayStatus::Disputed;
        env.storage().persistent().set(&giveaway_key, &giveaway);

        let now = env.ledger().timestamp();
        env.storage()
            .persistent()
            .set(&DataKey::DisputeRaisedAt(giveaway_id), &now);
        env.storage().persistent().set(
            &DataKey::DisputeRaisedBy(giveaway_id, caller.clone()),
            &true,
        );

        GiveawayDisputed {
            giveaway_id,
            raised_by: caller,
        }
        .publish(&env);
    }

    /// Admin-only: resolve a disputed giveaway.
    /// `release_funds = true`  → distribute prizes to winners (ResolvedRelease)
    /// `release_funds = false` → refund creator (ResolvedRefund)
    pub fn resolve_giveaway_dispute(env: Env, giveaway_id: u64, release_funds: bool) {
        use crate::access::check_admin;

        let resolver = check_admin(&env);

        let giveaway_key = DataKey::Giveaway(giveaway_id);
        let mut giveaway: Giveaway = env
            .storage()
            .persistent()
            .get(&giveaway_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::GiveawayNotFound));

        if giveaway.status != GiveawayStatus::Disputed {
            panic_with_error!(&env, Error::NotDisputed);
        }

        let token_client = token::Client::new(&env, &giveaway.token);

        if release_funds {
            let prize = giveaway.amount / i128::from(giveaway.winner_count);
            with_reentrancy_guard(&env, || {
                for winner in giveaway.winners.iter() {
                    token_client.transfer(&env.current_contract_address(), &winner, &prize);
                }
            });
            giveaway.status = GiveawayStatus::ResolvedRelease;
        } else {
            token_client.transfer(
                &env.current_contract_address(),
                &giveaway.creator,
                &giveaway.amount,
            );
            giveaway.status = GiveawayStatus::ResolvedRefund;
        }

        env.storage().persistent().set(&giveaway_key, &giveaway);
        GiveawayResolved {
            giveaway_id,
            release_funds,
            resolver,
        }
        .publish(&env);
    }
}

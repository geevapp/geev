use crate::types::{DataKey, Error, Giveaway, GiveawayStatus};
use crate::utils::with_reentrancy_guard;
use soroban_sdk::{contract, contractimpl, panic_with_error, token, Address, Env, String};

#[contract]
pub struct GiveawayContract;

#[contractimpl]
impl GiveawayContract {
    pub fn create_giveaway(
        env: Env,
        creator: Address,
        token: Address,
        amount: i128,
        title: String,
        duration_seconds: u64,
    ) -> u64 {
        creator.require_auth();

        // Check if token is whitelisted
        let token_key = DataKey::AllowedToken(token.clone());
        let is_allowed: bool = env.storage().instance().get(&token_key).unwrap_or(false);

        if !is_allowed {
            panic_with_error!(&env, Error::TokenNotSupported);
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&creator, &env.current_contract_address(), &amount);

        let giveaway_id = Self::generate_id(&env);
        let end_time = env.ledger().timestamp() + duration_seconds;

        let giveaway = Giveaway {
            id: giveaway_id,
            creator,
            token,
            amount,
            title,
            participant_count: 0,
            end_time,
            status: GiveawayStatus::Active,
            winner: None,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Giveaway(giveaway_id), &giveaway);

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

        env.storage().persistent().set(&has_entered_key, &true);

        let index_key = DataKey::ParticipantIndex(giveaway_id, giveaway.participant_count);
        env.storage().persistent().set(&index_key, &participant);

        giveaway.participant_count += 1;
        env.storage().persistent().set(&giveaway_key, &giveaway);
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

        let random_seed = env.prng().gen::<u64>();
        let winner_index = (random_seed % giveaway.participant_count as u64) as u32;

        let participant_key = DataKey::ParticipantIndex(giveaway_id, winner_index);
        let winner_address: Address = env
            .storage()
            .persistent()
            .get(&participant_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::InvalidIndex));

        giveaway.winner = Some(winner_address.clone());
        giveaway.status = GiveawayStatus::Claimable;
        env.storage().persistent().set(&giveaway_key, &giveaway);

        winner_address
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

            let winner = giveaway
                .winner
                .clone()
                .unwrap_or_else(|| panic_with_error!(&env, Error::NoParticipants));

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

            // 3. Transfer 'net_prize' to Winner
            let token_client = token::Client::new(&env, &giveaway.token);
            token_client.transfer(&env.current_contract_address(), &winner, &net_prize);

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

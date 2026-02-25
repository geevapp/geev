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

            let token_client = token::Client::new(&env, &giveaway.token);
            token_client.transfer(&env.current_contract_address(), &winner, &giveaway.amount);

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
}

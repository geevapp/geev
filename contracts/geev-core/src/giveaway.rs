use soroban_sdk::{contracttype, Address, Env, Symbol, token};

#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
pub enum GiveawayStatus {
    Active,
    Ended,
}

#[derive(Clone)]
#[contracttype]
pub struct Giveaway {
    pub id: u64,
    pub status: GiveawayStatus,
    pub creator: Address,
    pub token: Address,
    pub amount: i128,
    pub end_time: u64,
    pub participant_count: u32,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Giveaway(u64),
    Participant(u64, Address),
    GiveawayCount,
}

pub fn create_giveaway(
    env: Env,
    creator: Address,
    token: Address,
    amount: i128,
    end_time: u64,
) -> u64 {
    creator.require_auth();

    // Initialize the Token Client using the provided token address
    let token_client = token::Client::new(&env, &token);

    // Execute transfer from creator to current contract
    token_client.transfer(&creator, &env.current_contract_address(), &amount);

    // Generate a new Giveaway ID
    let count_key = DataKey::GiveawayCount;
    let mut count: u64 = env.storage().instance().get(&count_key).unwrap_or(0);
    count += 1;
    env.storage().instance().set(&count_key, &count);

    // Create Giveaway struct
    let giveaway = Giveaway {
        id: count,
        status: GiveawayStatus::Active,
        creator: creator.clone(),
        token: token.clone(),
        amount,
        end_time,
        participant_count: 0,
    };

    // Save struct to Persistent Storage under key: Giveaway(id)
    let giveaway_key = DataKey::Giveaway(count);
    env.storage().persistent().set(&giveaway_key, &giveaway);

    // Emit GiveawayCreated event for the NestJS indexer
    env.events().publish(
        (Symbol::new(&env, "GiveawayCreated"), count, creator),
        (amount, token),
    );

    count
}

pub fn enter_giveaway(env: Env, user: Address, giveaway_id: u64) {
    user.require_auth();

    let giveaway_key = DataKey::Giveaway(giveaway_id);
    let mut giveaway: Giveaway = env
        .storage()
        .persistent()
        .get(&giveaway_key)
        .unwrap_or_else(|| panic!("Giveaway Not Found"));

    let now = env.ledger().timestamp();
    if now > giveaway.end_time {
        panic!("Giveaway Ended");
    }

    let participant_key = DataKey::Participant(giveaway_id, user.clone());
    if env.storage().instance().has(&participant_key) {
        panic!("Double Entry");
    }

    env.storage().instance().set(&participant_key, &true);

    giveaway.participant_count += 1;
    env.storage().persistent().set(&giveaway_key, &giveaway);
}


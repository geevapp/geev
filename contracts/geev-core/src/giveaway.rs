use soroban_sdk::{contracttype, Address, Env, Symbol, token};

/// Initialize the contract with an admin address and fee settings
/// Can only be called once
pub fn initialize(env: Env, admin: Address, fee_basis_points: u32) {
    // Check if already initialized
    let admin_key = DataKey::Admin;
    if env.storage().instance().has(&admin_key) {
        panic!("Already Initialized");
    }

    // Store the admin address
    env.storage().instance().set(&admin_key, &admin);

    // Initialize paused state to false
    let paused_key = DataKey::Paused;
    env.storage().instance().set(&paused_key, &false);

    // Store fee basis points (e.g., 100 = 1%)
    let fee_key = DataKey::FeeBasisPoints;
    env.storage().instance().set(&fee_key, &fee_basis_points);

    // Emit initialization event
    env.events().publish(
        (Symbol::new(&env, "ContractInitialized"),),
        (admin, fee_basis_points),
    );
}

#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
pub enum GiveawayStatus {
    Active,
    Ended,
    Claimable,
    Completed,
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
    pub winner: Option<Address>,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Giveaway(u64),
    Participant(u64, Address),
    GiveawayCount,
    Admin,
    Paused,
    FeeBasisPoints,
}

pub fn create_giveaway(
    env: Env,
    creator: Address,
    token: Address,
    amount: i128,
    end_time: u64,
) -> u64 {
    creator.require_auth();
    check_paused(&env);

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
        winner: None,
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
    check_paused(&env);

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

/// Distribute prize to the winner
/// Transfer escrowed tokens from contract to winner and finalize giveaway
pub fn distribute_prize(env: Env, giveaway_id: u64) {
    // Load the Giveaway struct
    let giveaway_key = DataKey::Giveaway(giveaway_id);
    let mut giveaway: Giveaway = env
        .storage()
        .persistent()
        .get(&giveaway_key)
        .unwrap_or_else(|| panic!("Giveaway Not Found"));

    // Ensure status is Claimable
    if giveaway.status != GiveawayStatus::Claimable {
        panic!("Giveaway Not Claimable");
    }

    // Get winner address
    let winner = giveaway.winner.clone().unwrap_or_else(|| panic!("No Winner Set"));

    // Initialize Token Client using the token from giveaway
    let token_client = token::Client::new(&env, &giveaway.token);

    // Transfer amount from contract to winner
    token_client.transfer(&env.current_contract_address(), &winner, &giveaway.amount);

    // Update status to Completed
    giveaway.status = GiveawayStatus::Completed;

    // Save updated Giveaway struct
    env.storage().persistent().set(&giveaway_key, &giveaway);

    // Emit PrizeClaimed event
    env.events().publish(
        (Symbol::new(&env, "PrizeClaimed"),),
        (giveaway_id, winner, giveaway.amount),
    );
}

/// Check if the contract is paused
/// Panics with "ContractPaused" if the contract is paused
fn check_paused(env: &Env) {
    let paused_key = DataKey::Paused;
    // Use has() to check existence first, then get if exists
    if env.storage().instance().has(&paused_key) {
        let is_paused: bool = env.storage().instance().get(&paused_key).unwrap();
        if is_paused {
            panic!("ContractPaused");
        }
    }
    // If key doesn't exist, contract is not paused (default behavior)
}

/// Admin function to pause or unpause the contract
/// Only the admin can call this function
pub fn set_paused(env: Env, admin: Address, paused: bool) {
    admin.require_auth();

    // Verify that the caller is the admin
    let admin_key = DataKey::Admin;
    let stored_admin: Address = env
        .storage()
        .instance()
        .get(&admin_key)
        .unwrap_or_else(|| panic!("Admin Not Set"));

    if admin != stored_admin {
        panic!("Unauthorized");
    }

    // Set the paused state
    let paused_key = DataKey::Paused;
    env.storage().instance().set(&paused_key, &paused);

    // Emit event for indexing
    env.events().publish(
        (Symbol::new(&env, "PausedStateChanged"),),
        paused,
    );
}


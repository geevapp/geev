use soroban_sdk::{contracttype, Address, Env};

#[derive(Clone)]
#[contracttype]
pub struct Giveaway {
    pub end_time: u64,
    pub participant_count: u32,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Giveaway(u64),
    Participant(u64, Address),
}

pub fn enter_giveaway(env: Env, user: Address, giveaway_id: u64) {
    user.require_auth();

    let giveaway_key = DataKey::Giveaway(giveaway_id);
    let mut giveaway: Giveaway = env
        .storage()
        .instance()
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
    env.storage().instance().set(&giveaway_key, &giveaway);
}

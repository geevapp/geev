use soroban_sdk::{contracttype, Address, Env};

#[derive(Clone, Copy, PartialEq, Eq)]
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

pub fn create_giveaway(env: &Env, giveaway_id: u64, end_time: u64) {
    let key = DataKey::Giveaway(giveaway_id);
    let giveaway = Giveaway {
        end_time,
        participant_count: 0,
    };
    env.storage().persistent().set(&key, &giveaway);
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
    if env.storage().persistent().has(&participant_key) {
        panic!("Double Entry");
    }

    env.storage().persistent().set(&participant_key, &true);

    giveaway.participant_count += 1;
    env.storage().persistent().set(&giveaway_key, &giveaway);
}

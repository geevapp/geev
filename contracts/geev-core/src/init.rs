use soroban_sdk::{Address, Env, Symbol};

use crate::storage::DataKey;

pub fn init(env: Env, admin: Address, fee_bps: u32) {
    // Check if the contract has already been initialized
    let admin_key = DataKey::Admin;
    if env.storage().instance().has(&admin_key) {
        panic!("Already Initialized");
    }

    // Store the admin address
    env.storage().instance().set(&admin_key, &admin);

    // Store the fee basis points
    let fee_key = DataKey::Fee;
    env.storage().instance().set(&fee_key, &fee_bps);

    // Emit ContractInitialized event
    env.events().publish(
        (Symbol::new(&env, "ContractInitialized"), admin),
        fee_bps,
    );
}

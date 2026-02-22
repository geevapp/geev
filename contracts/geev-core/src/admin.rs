use soroban_sdk::{token, Address, Env, Symbol};

use crate::types::DataKey;

pub fn set_admin(env: Env, admin: Address) {
    // Only allow setting admin if not already set
    if env.storage().instance().has(&DataKey::Admin) {
        panic!("Admin Already Set");
    }

    admin.require_auth();
    env.storage().instance().set(&DataKey::Admin, &admin);
}

pub fn admin_withdraw(env: Env, token: Address, amount: i128, to: Address) {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| panic!("Admin Not Set"));

    admin.require_auth();

    let token_client = token::Client::new(&env, &token);
    token_client.transfer(&env.current_contract_address(), &to, &amount);

    env.events().publish(
        (Symbol::new(&env, "EmergencyWithdraw"),),
        (token, amount, to),
    );
}

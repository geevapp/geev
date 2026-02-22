use soroban_sdk::{token, Address, Env, Symbol};

use crate::DataKey;

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

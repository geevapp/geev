use crate::types::{DataKey, Error};
use soroban_sdk::{panic_with_error, token, Address, Env, Symbol};

pub fn admin_withdraw(env: Env, token: Address, amount: i128, to: Address) {
    // Load Admin address from storage
    let admin_key = DataKey::Admin;
    let admin: Address = env
        .storage()
        .instance()
        .get(&admin_key)
        .unwrap_or_else(|| panic_with_error!(&env, Error::NotAdmin));

    // Require Admin authentication
    admin.require_auth();

    // Initialize Token Client
    let token_client = token::Client::new(&env, &token);

    // Execute transfer: From contract -> to
    token_client.transfer(&env.current_contract_address(), &to, &amount);

    // Emit EmergencyWithdraw event
    env.events().publish(
        (Symbol::new(&env, "EmergencyWithdraw"), token.clone()),
        (amount, to.clone()),
    );
}

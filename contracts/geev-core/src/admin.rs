use crate::types::{DataKey, Error};
use soroban_sdk::{contract, contractimpl, panic_with_error, token, Address, Env, Symbol};

#[contract]
pub struct AdminContract;

#[contractimpl]
impl AdminContract {
    /// Emergency withdraw function - callable only by Admin
    /// Allows rescuing funds in case of critical bugs, exploits, or migration needs
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `token` - The token address to withdraw
    /// * `amount` - The amount to withdraw
    /// * `to` - The safe address to send funds to
    ///
    /// # Panics
    /// Panics if called by non-admin address
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
}

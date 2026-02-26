use crate::access::check_admin;
use crate::types::DataKey;
use soroban_sdk::{contract, contractimpl, token, Address, Env, Symbol};

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
        // Check admin authentication
        check_admin(&env);

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

    /// Add a token to the whitelist - callable only by Admin
    /// Allows specific tokens to be used for giveaway creation
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `token` - The token address to whitelist
    ///
    /// # Panics
    /// Panics if called by non-admin address
    pub fn add_token(env: Env, token: Address) {
        // Check admin authentication
        check_admin(&env);

        // Add token to whitelist
        let token_key = DataKey::AllowedToken(token.clone());
        env.storage().instance().set(&token_key, &true);

        // Emit TokenAdded event
        env.events()
            .publish((Symbol::new(&env, "TokenAdded"),), token);
    }

    /// Withdraw collected fees for a specific token - callable only by Admin
    /// Transfers all accumulated fees for the specified token to the admin address
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `token` - The token address to withdraw fees for
    ///
    /// # Panics
    /// Panics if called by non-admin address
    pub fn withdraw_fees(env: Env, token: Address) {
        // 1. Admin auth
        check_admin(&env);

        // 2. Read 'CollectedFees(token)' amount
        let collected_fees_key = DataKey::CollectedFees(token.clone());
        let fee_amount: i128 = env
            .storage()
            .persistent()
            .get(&collected_fees_key)
            .unwrap_or(0);

        // Only proceed if there are fees to withdraw
        if fee_amount > 0 {
            // Get admin address
            let admin_key = DataKey::Admin;
            let admin: Address = env
                .storage()
                .instance()
                .get(&admin_key)
                .expect("Admin not set");

            // 3. Transfer that amount to Admin
            let token_client = token::Client::new(&env, &token);
            token_client.transfer(&env.current_contract_address(), &admin, &fee_amount);

            // 4. Set 'CollectedFees(token)' to 0
            env.storage().persistent().set(&collected_fees_key, &0i128);

            // Emit FeesWithdrawn event
            env.events().publish(
                (Symbol::new(&env, "FeesWithdrawn"), token.clone()),
                (fee_amount, admin.clone()),
            );
        }
    }
}

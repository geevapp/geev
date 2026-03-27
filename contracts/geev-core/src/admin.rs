use crate::types::{DataKey, Error};
use crate::{access::check_admin, types::HelpRequest};
use soroban_sdk::{contract, contractevent, contractimpl, panic_with_error, token, Address, Env};

#[contract]
pub struct AdminContract;

#[contractevent]
pub struct EmergencyWithdraw {
    token: Address,
    amount: i128,
    to: Address,
}

#[contractevent]
pub struct TokenAdded {
    token: Address,
}

#[contractevent]
pub struct RequestVerificationChanged {
    request_id: u64,
    is_verified: bool,
}

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
        EmergencyWithdraw {
            token: token.clone(),
            amount,
            to: to.clone(),
        }
        .publish(&env);
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
        TokenAdded { token }.publish(&env);
    }

    pub fn toggle_request_verification(env: Env, request_id: u64) {
        check_admin(&env);

        let request_key = DataKey::HelpRequest(request_id);
        let mut request: HelpRequest = env
            .storage()
            .persistent()
            .get(&request_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::HelpRequestNotFound));

        if request.is_verified {
            request.is_verified = false;
        } else {
            request.is_verified = true;
        }

        env.storage().persistent().set(&request_key, &request);
        RequestVerificationChanged {
            request_id,
            is_verified: request.is_verified,
        }
        .publish(&env);
    }
}

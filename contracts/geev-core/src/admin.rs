use crate::types::{DataKey, Error, HelpRequest};
use crate::{access::check_admin, types::HelpRequestStatus};
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

// ─── Dispute Resolution Events ─────────────────────────────────────────────
#[contractevent]
pub struct DisputeResolvedByAdmin {
    item_id: u64,
    item_type: u32, // 0 = giveaway, 1 = help request
    release_funds: bool,
}

#[contractimpl]
impl AdminContract {
    pub fn admin_withdraw(env: Env, token: Address, amount: i128, to: Address) {
        check_admin(&env);
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &to, &amount);
        EmergencyWithdraw {
            token: token.clone(),
            amount,
            to: to.clone(),
        }
        .publish(&env);
    }

    pub fn add_token(env: Env, token: Address) {
        check_admin(&env);
        let token_key = DataKey::AllowedToken(token.clone());
        env.storage().instance().set(&token_key, &true);
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

        request.is_verified = !request.is_verified;

        env.storage().persistent().set(&request_key, &request);
        RequestVerificationChanged {
            request_id,
            is_verified: request.is_verified,
        }
        .publish(&env);
    }

    /// Admin resolves a disputed help request.
    /// Delegates to MutualAidContract::resolve_dispute.
    pub fn resolve_help_request_dispute(env: Env, request_id: u64, release_funds: bool) {
        check_admin(&env);
        crate::mutual_aid::MutualAidContract::resolve_dispute(env, request_id, release_funds);
    }

    /// Admin resolves a disputed giveaway.
    /// Delegates to GiveawayContract::resolve_giveaway_dispute.
    pub fn resolve_giveaway_dispute(env: Env, giveaway_id: u64, release_funds: bool) {
        check_admin(&env);
        crate::giveaway::GiveawayContract::resolve_giveaway_dispute(
            env,
            giveaway_id,
            release_funds,
        );
    }
}

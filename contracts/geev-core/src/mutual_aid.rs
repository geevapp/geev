use crate::types::{DataKey, Error, HelpRequest, HelpRequestStatus};
use soroban_sdk::{contract, contractimpl, panic_with_error, token, Address, Env, Symbol};

#[contract]
pub struct MutualAidContract;

#[contractimpl]
impl MutualAidContract {
    pub fn donate(env: Env, donor: Address, request_id: u64, amount: i128) {
        donor.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidDonationAmount);
        }

        let request_key = DataKey::HelpRequest(request_id);
        let mut request: HelpRequest = env
            .storage()
            .persistent()
            .get(&request_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::HelpRequestNotFound));

        if request.status == HelpRequestStatus::FullyFunded {
            panic_with_error!(&env, Error::HelpRequestAlreadyFullyFunded);
        }

        if request.status == HelpRequestStatus::Cancelled {
            panic_with_error!(&env, Error::InvalidStatus);
        }

        let token_client = token::Client::new(&env, &request.token);

        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        // ✅ Track individual donation for refund logic
        let donation_key = DataKey::Donation(request_id, donor.clone());
        let previous_donation: i128 = env.storage().persistent().get(&donation_key).unwrap_or(0);
        let new_donation = previous_donation
            .checked_add(amount)
            .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow));
        env.storage().persistent().set(&donation_key, &new_donation);

        // ✅ Explicit overflow check for total raised
        let new_raised = request
            .raised_amount
            .checked_add(amount)
            .unwrap_or_else(|| panic_with_error!(&env, Error::ArithmeticOverflow));

        request.raised_amount = new_raised;

        if new_raised >= request.goal {
            request.status = HelpRequestStatus::FullyFunded;
        }

        env.storage().persistent().set(&request_key, &request);

        env.events().publish(
            (Symbol::new(&env, "DonationReceived"), request_id, donor),
            (amount,),
        );
    }

    pub fn claim_refund(env: Env, donor: Address, request_id: u64) {
        donor.require_auth();

        let request_key = DataKey::HelpRequest(request_id);
        let request: HelpRequest = env
            .storage()
            .persistent()
            .get(&request_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::HelpRequestNotFound));

        if request.status != HelpRequestStatus::Cancelled {
            panic_with_error!(&env, Error::InvalidStatus);
        }

        let donation_key = DataKey::Donation(request_id, donor.clone());
        let amount: i128 = env.storage().persistent().get(&donation_key).unwrap_or(0);

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidDonationAmount);
        }

        let token_client = token::Client::new(&env, &request.token);
        token_client.transfer(&env.current_contract_address(), &donor, &amount);

        // Reset donation amount to prevent double refund
        env.storage().persistent().set(&donation_key, &0i128);

        env.events().publish(
            (Symbol::new(&env, "RefundClaimed"), request_id, donor),
            (amount,),
        );
    }

    pub fn cancel_request(env: Env, creator: Address, request_id: u64) {
        creator.require_auth();

        let request_key = DataKey::HelpRequest(request_id);
        let mut request: HelpRequest = env
            .storage()
            .persistent()
            .get(&request_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::HelpRequestNotFound));

        if request.creator != creator {
            panic_with_error!(&env, Error::NotCreator);
        }

        if request.status != HelpRequestStatus::Open {
            panic_with_error!(&env, Error::InvalidStatus);
        }

        request.status = HelpRequestStatus::Cancelled;
        env.storage().persistent().set(&request_key, &request);

        env.events().publish(
            (Symbol::new(&env, "RequestCancelled"), request_id),
            (creator,),
        );
    }
}

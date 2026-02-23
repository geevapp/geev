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

        let token_client = token::Client::new(&env, &request.token);

        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        // ✅ Explicit overflow check
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
}

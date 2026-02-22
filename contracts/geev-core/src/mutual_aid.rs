use soroban_sdk::{contracttype, token, Address, Env, Symbol};

#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
pub enum HelpRequestStatus {
    Open,
    FullyFunded,
    Closed,
}

#[derive(Clone)]
#[contracttype]
pub struct HelpRequest {
    pub id: u64,
    pub creator: Address,
    pub token: Address,
    pub goal: i128,
    pub raised_amount: i128,
    pub status: HelpRequestStatus,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    HelpRequest(u64),
    HelpRequestCount,
}

pub fn donate(env: Env, donor: Address, request_id: u64, amount: i128) {
    donor.require_auth();

    if amount <= 0 {
        panic!("Donation amount must be positive");
    }

    let request_key = DataKey::HelpRequest(request_id);
    let mut request: HelpRequest = env
        .storage()
        .persistent()
        .get(&request_key)
        .unwrap_or_else(|| panic!("Help Request Not Found"));

    if request.status == HelpRequestStatus::FullyFunded {
        panic!("Help Request Already Fully Funded");
    }

    let token_client = token::Client::new(&env, &request.token);

    token_client.transfer(&donor, &env.current_contract_address(), &amount);

    let new_raised = request.raised_amount + amount;
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

use crate::admin::{AdminContract, AdminContractClient};
use crate::giveaway::{GiveawayContract, GiveawayContractClient};
use crate::mutual_aid::{MutualAidContract, MutualAidContractClient};
use crate::types::{DataKey, HelpRequest, HelpRequestStatus};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, String,
};

#[test]
fn test_giveaway_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GiveawayContract, ());
    let contract_client = GiveawayContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);

    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_client = token::Client::new(&env, &mock_token);
    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let creator = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    token_admin_client.mint(&creator, &1000);

    let title = String::from_str(&env, "Test Giveaway");
    let amount = 500;
    let duration = 60;

    let target_giveaway_id =
        contract_client.create_giveaway(&creator, &mock_token, &amount, &title, &duration);

    assert_eq!(token_client.balance(&creator), 500);
    assert_eq!(token_client.balance(&contract_id), 500);
    assert_eq!(target_giveaway_id, 1);

    contract_client.enter_giveaway(&user1, &target_giveaway_id);
    contract_client.enter_giveaway(&user2, &target_giveaway_id);

    env.ledger().with_mut(|li| {
        li.timestamp += 100;
    });

    let winner = contract_client.pick_winner(&target_giveaway_id);

    assert!(winner == user1 || winner == user2);
}

#[test]
#[should_panic]
fn test_double_entry_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GiveawayContract, ());
    let contract_client = GiveawayContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);

    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let creator = Address::generate(&env);
    let greedy_user = Address::generate(&env);

    token_admin_client.mint(&creator, &1000);

    let id = contract_client.create_giveaway(
        &creator,
        &mock_token,
        &500,
        &String::from_str(&env, "Test"),
        &60,
    );

    contract_client.enter_giveaway(&greedy_user, &id);

    contract_client.enter_giveaway(&greedy_user, &id);
}

#[test]
#[should_panic]
fn test_enter_late_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GiveawayContract, ());
    let contract_client = GiveawayContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);

    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let creator = Address::generate(&env);
    let late_user = Address::generate(&env);

    token_admin_client.mint(&creator, &1000);

    let id = contract_client.create_giveaway(
        &creator,
        &mock_token,
        &500,
        &String::from_str(&env, "Test"),
        &60,
    );

    env.ledger().with_mut(|li| {
        li.timestamp += 100;
    });

    contract_client.enter_giveaway(&late_user, &id);
}

#[test]
#[should_panic]
fn test_pick_winner_early_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GiveawayContract, ());
    let contract_client = GiveawayContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);

    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let creator = Address::generate(&env);
    let user = Address::generate(&env);

    token_admin_client.mint(&creator, &1000);

    let id = contract_client.create_giveaway(
        &creator,
        &mock_token,
        &500,
        &String::from_str(&env, "Test"),
        &60,
    );

    contract_client.enter_giveaway(&user, &id);

    contract_client.pick_winner(&id);
}

#[test]
fn test_donation_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MutualAidContract, ());
    let contract_client = MutualAidContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_client = token::Client::new(&env, &mock_token);
    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let creator = Address::generate(&env);
    let donor1 = Address::generate(&env);
    let donor2 = Address::generate(&env);

    token_admin_client.mint(&donor1, &1000);
    token_admin_client.mint(&donor2, &1000);

    let request_id: u64 = 1;
    let goal = 1000;
    let donation1 = 300;
    let donation2 = 700;

    env.as_contract(&contract_id, || {
        let request = HelpRequest {
            id: request_id,
            creator: creator.clone(),
            token: mock_token.clone(),
            goal,
            raised_amount: 0,
            status: HelpRequestStatus::Open,
        };
        env.storage()
            .persistent()
            .set(&DataKey::HelpRequest(request_id), &request);
    });

    assert_eq!(token_client.balance(&donor1), 1000);
    assert_eq!(token_client.balance(&contract_id), 0);

    contract_client.donate(&donor1, &request_id, &donation1);

    assert_eq!(token_client.balance(&donor1), 700);
    assert_eq!(token_client.balance(&contract_id), 300);

    contract_client.donate(&donor2, &request_id, &donation2);

    assert_eq!(token_client.balance(&donor2), 300);
    assert_eq!(token_client.balance(&contract_id), 1000);

    env.as_contract(&contract_id, || {
        let request: HelpRequest = env
            .storage()
            .persistent()
            .get(&DataKey::HelpRequest(request_id))
            .unwrap();
        assert_eq!(request.raised_amount, goal);
        assert_eq!(request.status, HelpRequestStatus::FullyFunded);
    });
}

#[test]
fn test_donation_reaches_goal() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MutualAidContract, ());
    let contract_client = MutualAidContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);

    token_admin_client.mint(&donor, &2000);

    let request_id: u64 = 2;
    let goal = 500;
    let donation = 500;

    env.as_contract(&contract_id, || {
        let request = HelpRequest {
            id: request_id,
            creator: creator.clone(),
            token: mock_token.clone(),
            goal,
            raised_amount: 0,
            status: HelpRequestStatus::Open,
        };
        env.storage()
            .persistent()
            .set(&DataKey::HelpRequest(request_id), &request);
    });

    contract_client.donate(&donor, &request_id, &donation);

    env.as_contract(&contract_id, || {
        let request: HelpRequest = env
            .storage()
            .persistent()
            .get(&DataKey::HelpRequest(request_id))
            .unwrap();
        assert_eq!(request.raised_amount, goal);
        assert_eq!(request.status, HelpRequestStatus::FullyFunded);
    });
}

#[test]
#[should_panic]
fn test_donation_to_nonexistent_request_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MutualAidContract, ());
    let contract_client = MutualAidContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let donor = Address::generate(&env);
    token_admin_client.mint(&donor, &1000);

    let nonexistent_request_id: u64 = 999;

    contract_client.donate(&donor, &nonexistent_request_id, &100);
}

#[test]
#[should_panic]
fn test_donation_to_fully_funded_request_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MutualAidContract, ());
    let contract_client = MutualAidContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);

    token_admin_client.mint(&donor, &1000);

    let request_id: u64 = 3;
    let goal = 500;

    env.as_contract(&contract_id, || {
        let request = HelpRequest {
            id: request_id,
            creator: creator.clone(),
            token: mock_token.clone(),
            goal,
            raised_amount: goal,
            status: HelpRequestStatus::FullyFunded,
        };
        env.storage()
            .persistent()
            .set(&DataKey::HelpRequest(request_id), &request);
    });

    contract_client.donate(&donor, &request_id, &100);
}

#[test]
#[should_panic]
fn test_donation_with_invalid_amount_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MutualAidContract, ());
    let contract_client = MutualAidContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);

    token_admin_client.mint(&donor, &1000);

    let request_id: u64 = 4;
    let goal = 500;

    env.as_contract(&contract_id, || {
        let request = HelpRequest {
            id: request_id,
            creator: creator.clone(),
            token: mock_token.clone(),
            goal,
            raised_amount: 0,
            status: HelpRequestStatus::Open,
        };
        env.storage()
            .persistent()
            .set(&DataKey::HelpRequest(request_id), &request);
    });

    contract_client.donate(&donor, &request_id, &0);
}

#[test]
fn test_distribute_prize() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GiveawayContract, ());
    let contract_client = GiveawayContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_client = token::Client::new(&env, &mock_token);
    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let creator = Address::generate(&env);
    let winner = Address::generate(&env);

    token_admin_client.mint(&creator, &1000);

    let giveaway_id = contract_client.create_giveaway(
        &creator,
        &mock_token,
        &500,
        &String::from_str(&env, "Prize Test"),
        &60,
    );

    contract_client.enter_giveaway(&winner, &giveaway_id);

    env.ledger().with_mut(|li| {
        li.timestamp += 100;
    });

    let picked_winner = contract_client.pick_winner(&giveaway_id);
    assert_eq!(picked_winner, winner);

    assert_eq!(token_client.balance(&winner), 0);
    assert_eq!(token_client.balance(&contract_id), 500);

    contract_client.distribute_prize(&giveaway_id);

    assert_eq!(token_client.balance(&winner), 500);
    assert_eq!(token_client.balance(&contract_id), 0);
}

#[test]
fn test_init_contract() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GiveawayContract, ());
    let contract_client = GiveawayContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let fee_bps: u32 = 100;

    contract_client.init(&admin, &fee_bps);

    env.as_contract(&contract_id, || {
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let stored_fee: u32 = env.storage().instance().get(&DataKey::Fee).unwrap();

        assert_eq!(stored_admin, admin);
        assert_eq!(stored_fee, fee_bps);
    });
}

#[test]
#[should_panic]
fn test_distribute_prize_wrong_status_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GiveawayContract, ());
    let contract_client = GiveawayContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let creator = Address::generate(&env);
    token_admin_client.mint(&creator, &1000);

    let giveaway_id = contract_client.create_giveaway(
        &creator,
        &mock_token,
        &500,
        &String::from_str(&env, "Prize Test"),
        &60,
    );

    contract_client.distribute_prize(&giveaway_id);
}

#[test]
#[should_panic]
fn test_init_twice_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GiveawayContract, ());
    let contract_client = GiveawayContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let fee_bps: u32 = 100;

    contract_client.init(&admin, &fee_bps);
    contract_client.init(&admin, &fee_bps);
}

#[test]
fn test_admin_withdraw_success() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AdminContract, ());
    let contract_client = AdminContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_client = token::Client::new(&env, &mock_token);
    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let admin = Address::generate(&env);
    let safe_address = Address::generate(&env);

    // Initialize contract with admin
    env.as_contract(&contract_id, || {
        env.storage().instance().set(&DataKey::Admin, &admin);
    });

    // Mint tokens to contract
    token_admin_client.mint(&contract_id, &1000);

    assert_eq!(token_client.balance(&contract_id), 1000);
    assert_eq!(token_client.balance(&safe_address), 0);

    // Admin withdraws funds
    contract_client.admin_withdraw(&mock_token, &500, &safe_address);

    assert_eq!(token_client.balance(&contract_id), 500);
    assert_eq!(token_client.balance(&safe_address), 500);
}

#[test]
#[should_panic]
fn test_admin_withdraw_fails_non_admin() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AdminContract, ());
    let contract_client = AdminContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let safe_address = Address::generate(&env);

    // DO NOT initialize contract with admin - this should cause panic

    // Mint tokens to contract
    token_admin_client.mint(&contract_id, &1000);

    // Try to withdraw without admin being initialized - should panic
    contract_client.admin_withdraw(&mock_token, &500, &safe_address);
}

#[test]
fn test_admin_withdraw_full_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AdminContract, ());
    let contract_client = AdminContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_client = token::Client::new(&env, &mock_token);
    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let admin = Address::generate(&env);
    let safe_address = Address::generate(&env);

    // Initialize contract with admin
    env.as_contract(&contract_id, || {
        env.storage().instance().set(&DataKey::Admin, &admin);
    });

    // Mint tokens to contract
    token_admin_client.mint(&contract_id, &5000);

    assert_eq!(token_client.balance(&contract_id), 5000);

    // Admin withdraws full balance
    contract_client.admin_withdraw(&mock_token, &5000, &safe_address);

    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&safe_address), 5000);
}

#[test]
fn test_refund_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MutualAidContract, ());
    let contract_client = MutualAidContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let mock_token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    let token_client = token::Client::new(&env, &mock_token);
    let token_admin_client = token::StellarAssetClient::new(&env, &mock_token);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);

    token_admin_client.mint(&donor, &1000);

    let request_id: u64 = 10;
    let goal = 1000;
    let donation = 500;

    env.as_contract(&contract_id, || {
        let request = HelpRequest {
            id: request_id,
            creator: creator.clone(),
            token: mock_token.clone(),
            goal,
            raised_amount: 0,
            status: HelpRequestStatus::Open,
        };
        env.storage()
            .persistent()
            .set(&DataKey::HelpRequest(request_id), &request);
    });

    // 1. Donate
    contract_client.donate(&donor, &request_id, &donation);
    assert_eq!(token_client.balance(&donor), 500);
    assert_eq!(token_client.balance(&contract_id), 500);

    // 2. Cancel request
    contract_client.cancel_request(&creator, &request_id);

    // 3. Claim refund
    contract_client.claim_refund(&donor, &request_id);

    // 4. Verify balances
    assert_eq!(token_client.balance(&donor), 1000);
    assert_eq!(token_client.balance(&contract_id), 0);

    // 5. Verify donation reset
    env.as_contract(&contract_id, || {
        let donation_amount: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Donation(request_id, donor.clone()))
            .unwrap_or(-1);
        assert_eq!(donation_amount, 0);
    });
}

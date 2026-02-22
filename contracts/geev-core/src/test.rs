use crate::giveaway::{GiveawayContract, GiveawayContractClient};
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

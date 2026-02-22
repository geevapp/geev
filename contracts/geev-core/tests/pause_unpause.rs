use soroban_sdk::{
    testutils::{Address as AddressTest, Ledger},
    Address, Env,
};
use geev_core::{enter_giveaway, initialize, set_paused, DataKey, Giveaway, GiveawayStatus};

#[test]
fn test_initialize_contract() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = Address::generate(&env);

    env.as_contract(&contract_id, || {
        initialize(env.clone(), admin.clone());

        // Verify admin is set
        let admin_key = DataKey::Admin;
        let stored_admin: Address = env.storage().instance().get(&admin_key).unwrap();
        assert_eq!(stored_admin, admin);

        // Verify contract is not paused by default
        let paused_key = DataKey::Paused;
        let is_paused: bool = env.storage().instance().get(&paused_key).unwrap();
        assert_eq!(is_paused, false);
    });
}

#[test]
#[should_panic(expected = "Already Initialized")]
fn test_cannot_initialize_twice() {
    let env = Env::default();
    env.mock_all_auths();

    let admin1 = Address::generate(&env);
    let admin2 = Address::generate(&env);
    let contract_id = Address::generate(&env);

    env.as_contract(&contract_id, || {
        initialize(env.clone(), admin1.clone());

        // Try to initialize again - should panic
        initialize(env.clone(), admin2.clone());
    });
}

#[test]
fn test_admin_can_pause_contract() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = Address::generate(&env);

    env.as_contract(&contract_id, || {
        initialize(env.clone(), admin.clone());

        // Admin pauses the contract
        set_paused(env.clone(), admin.clone(), true);

        // Verify contract is paused
        let paused_key = DataKey::Paused;
        let is_paused: bool = env.storage().instance().get(&paused_key).unwrap();
        assert_eq!(is_paused, true);
    });
}

#[test]
fn test_admin_can_unpause_contract() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = Address::generate(&env);

    env.as_contract(&contract_id, || {
        initialize(env.clone(), admin.clone());

        // Admin pauses the contract
        set_paused(env.clone(), admin.clone(), true);

        // Admin unpauses the contract
        set_paused(env.clone(), admin.clone(), false);

        // Verify contract is not paused
        let paused_key = DataKey::Paused;
        let is_paused: bool = env.storage().instance().get(&paused_key).unwrap();
        assert_eq!(is_paused, false);
    });
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_non_admin_cannot_pause() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let non_admin = Address::generate(&env);
    let contract_id = Address::generate(&env);

    env.as_contract(&contract_id, || {
        initialize(env.clone(), admin.clone());

        // Non-admin tries to pause - should panic
        set_paused(env.clone(), non_admin.clone(), true);
    });
}

#[test]
#[should_panic(expected = "Admin Not Set")]
fn test_cannot_pause_before_initialization() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = Address::generate(&env);

    env.as_contract(&contract_id, || {
        // Try to pause before initializing - should panic
        set_paused(env.clone(), admin.clone(), true);
    });
}

#[test]
#[should_panic(expected = "ContractPaused")]
fn test_enter_giveaway_fails_when_paused() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(100);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let user = Address::generate(&env);
    let token = Address::generate(&env);
    let contract_id = Address::generate(&env);

    env.as_contract(&contract_id, || {
        initialize(env.clone(), admin.clone());

        // Create a giveaway in storage (bypassing the create function)
        let giveaway_id: u64 = 1;
        let giveaway_key = DataKey::Giveaway(giveaway_id);
        let giveaway = Giveaway {
            id: giveaway_id,
            status: GiveawayStatus::Active,
            creator: creator.clone(),
            token: token.clone(),
            amount: 100,
            end_time: 200,
            participant_count: 0,
        };
        env.storage().persistent().set(&giveaway_key, &giveaway);

        // Admin pauses the contract
        set_paused(env.clone(), admin.clone(), true);

        // Try to enter giveaway while paused - should panic
        enter_giveaway(env.clone(), user.clone(), giveaway_id);
    });
}

#[test]
fn test_can_enter_giveaway_when_not_paused() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(100);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let user = Address::generate(&env);
    let token = Address::generate(&env);
    let contract_id = Address::generate(&env);

    env.as_contract(&contract_id, || {
        initialize(env.clone(), admin.clone());

        // Create a giveaway in storage
        let giveaway_id: u64 = 1;
        let giveaway_key = DataKey::Giveaway(giveaway_id);
        let giveaway = Giveaway {
            id: giveaway_id,
            status: GiveawayStatus::Active,
            creator: creator.clone(),
            token: token.clone(),
            amount: 100,
            end_time: 200,
            participant_count: 0,
        };
        env.storage().persistent().set(&giveaway_key, &giveaway);

        // Enter giveaway while not paused - should succeed
        enter_giveaway(env.clone(), user.clone(), giveaway_id);

        // Verify participant was added
        let participant_key = DataKey::Participant(giveaway_id, user.clone());
        let is_participant: bool = env.storage().instance().get(&participant_key).unwrap();
        assert_eq!(is_participant, true);
    });
}

#[test]
fn test_can_enter_giveaway_after_unpause() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(100);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let user = Address::generate(&env);
    let token = Address::generate(&env);
    let contract_id = Address::generate(&env);

    env.as_contract(&contract_id, || {
        initialize(env.clone(), admin.clone());

        // Create a giveaway in storage
        let giveaway_id: u64 = 1;
        let giveaway_key = DataKey::Giveaway(giveaway_id);
        let giveaway = Giveaway {
            id: giveaway_id,
            status: GiveawayStatus::Active,
            creator: creator.clone(),
            token: token.clone(),
            amount: 100,
            end_time: 200,
            participant_count: 0,
        };
        env.storage().persistent().set(&giveaway_key, &giveaway);

        // Admin pauses the contract
        set_paused(env.clone(), admin.clone(), true);

        // Admin unpauses the contract
        set_paused(env.clone(), admin.clone(), false);

        // Enter giveaway after unpause - should succeed
        enter_giveaway(env.clone(), user.clone(), giveaway_id);

        // Verify participant was added
        let participant_key = DataKey::Participant(giveaway_id, user.clone());
        let is_participant: bool = env.storage().instance().get(&participant_key).unwrap();
        assert_eq!(is_participant, true);
    });
}

#[test]
fn test_admin_can_still_toggle_pause_when_paused() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = Address::generate(&env);

    env.as_contract(&contract_id, || {
        initialize(env.clone(), admin.clone());

        // Admin pauses the contract
        set_paused(env.clone(), admin.clone(), true);

        // Admin can still toggle pause state
        set_paused(env.clone(), admin.clone(), false);
        set_paused(env.clone(), admin.clone(), true);

        // Verify contract is paused
        let paused_key = DataKey::Paused;
        let is_paused: bool = env.storage().instance().get(&paused_key).unwrap();
        assert_eq!(is_paused, true);
    });
}

use geev_core::{create_giveaway, enter_giveaway};
use soroban_sdk::{
    contract, contractimpl,
    testutils::{Address as AddressTest, Ledger},
    Address, Env,
};

#[contract]
pub struct TestContract;

#[contractimpl]
impl TestContract {
    pub fn dummy(_env: Env) {}
}

#[test]
fn enter_once_before_end_increments_participant_count() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(10);
    let user = <Address as AddressTest>::generate(&env);

    let giveaway_id: u64 = 1;
    let contract_id = env.register(TestContract, ());

    env.as_contract(&contract_id, || {
        create_giveaway(&env, giveaway_id, 20);
        enter_giveaway(env.clone(), user.clone(), giveaway_id);
    });
}

#[test]
#[should_panic]
fn reject_entry_after_end_time() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(10);
    let user = <Address as AddressTest>::generate(&env);

    let giveaway_id: u64 = 2;
    let contract_id = env.register(TestContract, ());

    env.as_contract(&contract_id, || {
        create_giveaway(&env, giveaway_id, 5);
        enter_giveaway(env.clone(), user.clone(), giveaway_id);
    });
}

#[test]
#[should_panic]
fn reject_duplicate_entries() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(10);
    let user = <Address as AddressTest>::generate(&env);

    let giveaway_id: u64 = 3;
    let contract_id = env.register(TestContract, ());

    env.as_contract(&contract_id, || {
        create_giveaway(&env, giveaway_id, 20);
        enter_giveaway(env.clone(), user.clone(), giveaway_id);

        // second attempt should fail due to duplicate entry
        enter_giveaway(env.clone(), user.clone(), giveaway_id);
    });
}

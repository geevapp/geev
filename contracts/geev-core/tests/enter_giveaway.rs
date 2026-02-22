use geev_core::{enter_giveaway, DataKey, Giveaway, GiveawayStatus};
use soroban_sdk::{
    testutils::{Address as AddressTest, Ledger},
    Address, Env,
};

#[test]
fn enter_once_before_end_increments_participant_count() {
    let env = Env::default();
    env.ledger().set_timestamp(10);
    let user = <Address as AddressTest>::generate(&env);

    let giveaway_id: u64 = 1;
    let contract_id = <Address as AddressTest>::generate(&env);

    env.as_contract(&contract_id, || {
        let key = DataKey::Giveaway(giveaway_id);

        let creator = <Address as AddressTest>::generate(&env);
        let token = <Address as AddressTest>::generate(&env);

        let giveaway = Giveaway {
            id: giveaway_id,
            status: GiveawayStatus::Active,
            creator,
            token,
            amount: 1000,
            end_time: 20,
            participant_count: 0,
        };

        env.storage().persistent().set(&key, &giveaway);

        enter_giveaway(env.clone(), user.clone(), giveaway_id);
    });
}

#[test]
#[should_panic]
fn reject_entry_after_end_time() {
    let env = Env::default();
    env.ledger().set_timestamp(10);
    let user = <Address as AddressTest>::generate(&env);

    let giveaway_id: u64 = 2;
    let contract_id = <Address as AddressTest>::generate(&env);

    env.as_contract(&contract_id, || {
        let key = DataKey::Giveaway(giveaway_id);

        let creator = <Address as AddressTest>::generate(&env);
        let token = <Address as AddressTest>::generate(&env);

        let giveaway = Giveaway {
            id: giveaway_id,
            status: GiveawayStatus::Active,
            creator,
            token,
            amount: 1000,
            end_time: 5, // already ended relative to timestamp 10
            participant_count: 0,
        };

        env.storage().persistent().set(&key, &giveaway);

        enter_giveaway(env.clone(), user.clone(), giveaway_id);
    });
}

#[test]
#[should_panic]
fn reject_duplicate_entries() {
    let env = Env::default();
    env.ledger().set_timestamp(10);
    let user = <Address as AddressTest>::generate(&env);

    let giveaway_id: u64 = 3;
    let contract_id = <Address as AddressTest>::generate(&env);

    env.as_contract(&contract_id, || {
        let key = DataKey::Giveaway(giveaway_id);

        let creator = <Address as AddressTest>::generate(&env);
        let token = <Address as AddressTest>::generate(&env);

        let giveaway = Giveaway {
            id: giveaway_id,
            status: GiveawayStatus::Active,
            creator,
            token,
            amount: 1000,
            end_time: 20,
            participant_count: 0,
        };

        env.storage().persistent().set(&key, &giveaway);

        enter_giveaway(env.clone(), user.clone(), giveaway_id);

        // second attempt should fail due to duplicate entry
        enter_giveaway(env.clone(), user.clone(), giveaway_id);
    });
}

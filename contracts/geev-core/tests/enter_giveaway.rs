use soroban_sdk::{contract, contractimpl, testutils::{Address as AddressTest, Ledger}, Address, Env};
use geev_core::{enter_giveaway, DataKey, Giveaway, GiveawayStatus};

/// Minimal no-op contract used only to obtain a valid registered contract address
/// so that `env.as_contract` has a host-registered context for storage operations.
#[contract]
pub struct TestContract;

#[contractimpl]
impl TestContract {}

#[test]
fn enter_once_before_end_increments_participant_count() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(10);
    let user = <Address as AddressTest>::generate(&env);

    let giveaway_id: u64 = 1;
    let contract_id = env.register(TestContract, ());

#[test]
#[should_panic]
fn reject_entry_after_end_time() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(10);
    let user = <Address as AddressTest>::generate(&env);

    let giveaway_id: u64 = 2;
    let contract_id = env.register(TestContract, ());

#[test]
#[should_panic]
fn reject_duplicate_entries() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(10);
    let user = <Address as AddressTest>::generate(&env);

    let giveaway_id: u64 = 3;
    let contract_id = env.register(TestContract, ());

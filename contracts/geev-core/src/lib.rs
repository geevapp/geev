#![no_std]

pub mod admin;
pub mod giveaway;
pub mod mutual_aid;
pub mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env, String};

#[contract]
pub struct GeevContract;

#[contractimpl]
impl GeevContract {
    // Admin Module
    pub fn admin_withdraw(env: Env, token: Address, amount: i128, to: Address) {
        admin::admin_withdraw(env, token, amount, to);
    }

    // Mutual Aid Module
    pub fn donate(env: Env, donor: Address, request_id: u64, amount: i128) {
        mutual_aid::donate(env, donor, request_id, amount);
    }

    pub fn cancel_request(env: Env, creator: Address, request_id: u64) {
        mutual_aid::cancel_request(env, creator, request_id);
    }

    pub fn claim_refund(env: Env, donor: Address, request_id: u64) {
        mutual_aid::claim_refund(env, donor, request_id);
    }

    // Giveaway Module
    pub fn init(env: Env, admin: Address, fee_bps: u32) {
        giveaway::init(env, admin, fee_bps);
    }

    pub fn create_giveaway(
        env: Env,
        creator: Address,
        token: Address,
        amount: i128,
        title: String,
        duration_seconds: u64,
    ) -> u64 {
        giveaway::create_giveaway(env, creator, token, amount, title, duration_seconds)
    }

    pub fn enter_giveaway(env: Env, participant: Address, giveaway_id: u64) {
        giveaway::enter_giveaway(env, participant, giveaway_id);
    }

    pub fn pick_winner(env: Env, giveaway_id: u64) -> Address {
        giveaway::pick_winner(env, giveaway_id)
    }

    pub fn distribute_prize(env: Env, giveaway_id: u64) {
        giveaway::distribute_prize(env, giveaway_id);
    }
}

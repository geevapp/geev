#![no_std]
use soroban_sdk::{contract, contractimpl, contractmeta, Address, Env, String};

// Import modules
mod giveaway;
mod types;

// Re-export for external use
pub use giveaway::GiveawayContract;
pub use types::*;

// Metadata for the contract
contractmeta!(
    key = "Description",
    val = "Geev Core Contract - Decentralized Giveaway Platform"
);

#[cfg(test)]
mod test;
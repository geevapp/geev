#![no_std]

mod admin;
pub mod giveaway;
pub mod types;

#[cfg(test)]
mod test;

pub use crate::giveaway::GiveawayContract;
pub use crate::giveaway::GiveawayContractClient;
pub use admin::{admin_withdraw, set_admin};

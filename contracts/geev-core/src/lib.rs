#![no_std]

pub mod giveaway;
pub mod types;

#[cfg(test)]
mod test;

pub use crate::giveaway::GiveawayContract;
pub use crate::giveaway::GiveawayContractClient;

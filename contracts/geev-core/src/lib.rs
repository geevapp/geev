<<<<<<< HEAD
mod admin;
mod giveaway;

pub use admin::admin_withdraw;
pub use giveaway::{enter_giveaway, DataKey, Giveaway, GiveawayStatus};
=======
#![no_std]

pub mod giveaway;
pub mod types;
>>>>>>> 4c08c5aca9f1992ca9c4c9249a88699547b1dc5f

#[cfg(test)]
mod test;

pub use crate::giveaway::GiveawayContract;
pub use crate::giveaway::GiveawayContractClient;

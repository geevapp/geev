pub mod profile;

pub use profile::{Error, ProfileContract, ProfileContractClient, ProfileData};
#![no_std]

pub mod admin;
pub mod giveaway;
pub mod mutual_aid;
pub mod types;
pub mod utils;

#[cfg(test)]
mod test;

pub use crate::admin::AdminContract;
pub use crate::admin::AdminContractClient;
pub use crate::giveaway::GiveawayContract;
pub use crate::giveaway::GiveawayContractClient;
pub use crate::mutual_aid::MutualAidContract;
pub use crate::mutual_aid::MutualAidContractClient;

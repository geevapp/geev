#![no_std]

mod giveaway;

pub use giveaway::{create_giveaway, enter_giveaway, initialize, set_paused, DataKey, Giveaway};


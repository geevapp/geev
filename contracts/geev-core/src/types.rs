use soroban_sdk::{contracterror, contracttype, Address, String};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    GiveawayNotFound = 1,
    InvalidStatus = 2,
    GiveawayStillActive = 3,
    GiveawayEnded = 4,
    NoParticipants = 5,
    InvalidIndex = 6,
    NotCreator = 7,
    AlreadyEntered = 8,
}

#[derive(Clone, PartialEq, Eq)]
#[contracttype]
pub enum GiveawayStatus {
    Active = 0,
    Claimable = 1,
    Completed = 2,
}

#[derive(Clone)]
#[contracttype]
pub struct Giveaway {
    pub id: u64,
    pub creator: Address,
    pub token: Address,
    pub amount: i128,
    pub title: String,
    pub participant_count: u32,
    pub end_time: u64,
    pub status: GiveawayStatus,
    pub winner: Option<Address>,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    GiveawayCounter,
    Giveaway(u64),
    ParticipantIndex(u64, u32),
    HasEntered(u64, Address),
}

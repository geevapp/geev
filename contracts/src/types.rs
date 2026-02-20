use soroban_sdk::{contracttype, Address, Env};

// Status enum for giveaway state
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum GiveawayStatus {
    Active,     
    Claimable,   
    Completed,   
    Cancelled,   
}

// Selection method for choosing winners
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum SelectionMethod {
    Random,     
    FirstCome,  
    Manual,     
}

// Main Giveaway struct
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Giveaway {
    pub id: u64,
    pub creator: Address,
    pub title: String,
    pub description: String,
    pub category: String,
    pub selection_method: SelectionMethod,
    pub winner_count: u32,
    pub participant_count: u32,
    pub end_time: u64,
    pub status: GiveawayStatus,
    pub winner: Option<Address>,
    pub created_at: u64,
}

// Entry struct for participants
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Entry {
    pub id: u64,
    pub giveaway_id: u64,
    pub participant: Address,
    pub entry_time: u64,
    pub content: String,
    pub is_winner: bool,
}

// Storage key types
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub struct GiveawayKey(pub u64);

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub struct EntryKey(pub u64);

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub struct ParticipantIndexKey(pub u64, pub u32); 

// Counter for generating unique IDs
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub struct CounterKey;

// Constants
pub const GIVEAWAY_COUNTER: CounterKey = CounterKey;

// Error types
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[contracttype]
pub enum Error {
    GiveawayNotFound = 1,
    GiveawayStillActive = 2,
    InvalidStatus = 3,
    NoParticipants = 4,
    NotCreator = 5,
    AlreadyCompleted = 6,
    InvalidIndex = 7,
    ParticipantAlreadyWinner = 8,
}

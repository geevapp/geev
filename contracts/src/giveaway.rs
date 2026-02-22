use soroban_sdk::{contract, contractimpl, panic_with_error, Address, Env};

use crate::types::{
    Entry, Error, Giveaway, GiveawayKey, GiveawayStatus, ParticipantIndexKey, SelectionMethod,
};

// Storage instance for accessing contract storage
pub struct GiveawayContract;

#[contract]
impl GiveawayContract {
    // Pick a winner for a giveaway using random selection
    // This function can only be called after the giveaway end_time
    // It uses env.prng() for pseudo-random selection (MVP approach)
    pub fn pick_winner(env: Env, giveaway_id: u64) -> Address {
        // Load the giveaway struct
        let giveaway_key = GiveawayKey(giveaway_id);
        let mut giveaway: Giveaway = env
            .storage()
            .get(&giveaway_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::GiveawayNotFound));

        // Ensure status is Active
        if giveaway.status != GiveawayStatus::Active {
            panic_with_error!(&env, Error::InvalidStatus);
        }

        // Check timing - can only execute after end_time
        let current_time = env.ledger().timestamp();
        if current_time <= giveaway.end_time {
            panic_with_error!(&env, Error::GiveawayStillActive);
        }

        // Check if there are participants
        if giveaway.participant_count == 0 {
            panic_with_error!(&env, Error::NoParticipants);
        }

        // Generate pseudo-random seed using ledger-based PRNG (MVP)
        let random_seed = env.prng().gen::<u64>();

        // Calculate winner index: 0 <= r < participant_count
        let winner_index = (random_seed % giveaway.participant_count as u64) as u32;

        // Retrieve winner address from ParticipantIndex storage
        let participant_key = ParticipantIndexKey(giveaway_id, winner_index);
        let winner_address: Address = env
            .storage()
            .get(&participant_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::InvalidIndex));

        // Update Giveaway struct
        giveaway.winner = Some(winner_address.clone());
        giveaway.status = GiveawayStatus::Claimable;

        // Save updated Giveaway struct to storage
        env.storage()
            .set(&giveaway_key, &giveaway);

        // Update the winner's entry record
        Self::mark_entry_as_winner(&env, giveaway_id, winner_address.clone());

        winner_address
    }

    // Create a new giveaway
    pub fn create_giveaway(
        env: Env,
        creator: Address,
        title: String,
        description: String,
        category: String,
        selection_method: SelectionMethod,
        winner_count: u32,
        duration_seconds: u64, 
    ) -> u64 {
        creator.require_auth();

        // Generate new giveaway ID
        let giveaway_id = Self::generate_id(&env);

        let current_time = env.ledger().timestamp();
        let end_time = current_time + duration_seconds;

        let giveaway = Giveaway {
            id: giveaway_id,
            creator,
            title,
            description,
            category,
            selection_method,
            winner_count,
            participant_count: 0,
            end_time,
            status: GiveawayStatus::Active,
            winner: None,
            created_at: current_time,
        };

        let giveaway_key = GiveawayKey(giveaway_id);
        env.storage().instance().set(&giveaway_key, &giveaway);

        giveaway_id
    }

    // Add participant to a giveaway
    pub fn add_participant(
        env: Env,
        giveaway_id: u64,
        participant: Address,
        content: String,
    ) -> u64 {
        participant.require_auth();

        let giveaway_key = GiveawayKey(giveaway_id);
        let mut giveaway: Giveaway = env
            .storage()
            .get(&giveaway_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::GiveawayNotFound));

        // Check if giveaway is still active
        if giveaway.status != GiveawayStatus::Active {
            panic_with_error!(&env, Error::InvalidStatus);
        }

        // Check if giveaway has ended
        let current_time = env.ledger().timestamp();
        if current_time > giveaway.end_time {
            panic_with_error!(&env, Error::GiveawayStillActive);
        }

        // Generate entry ID
        let entry_id = Self::generate_id(&env);

        let entry = Entry {
            id: entry_id,
            giveaway_id,
            participant: participant.clone(),
            entry_time: current_time,
            content,
            is_winner: false,
        };

        // Store entry
        let entry_key = crate::types::EntryKey(entry_id);
        env.storage().instance().set(&entry_key, &entry);

        // Update participant index
        let participant_index = giveaway.participant_count;
        let participant_key = ParticipantIndexKey(giveaway_id, participant_index);
        env.storage()
            .set(&participant_key, &participant);

        // Update giveaway participant count
        giveaway.participant_count += 1;
        env.storage()
            .set(&giveaway_key, &giveaway);

        entry_id
    }

    // Get giveaway details
    pub fn get_giveaway(env: Env, giveaway_id: u64) -> Option<Giveaway> {
        let giveaway_key = GiveawayKey(giveaway_id);
        env.storage().instance().get(&giveaway_key)
    }

    // Get participant at specific index
    pub fn get_participant_at_index(
        env: Env,
        giveaway_id: u64,
        index: u32,
    ) -> Option<Address> {
        let participant_key = ParticipantIndexKey(giveaway_id, index);
        env.storage().instance().get(&participant_key)
    }

    // Mark entry as winner
    fn mark_entry_as_winner(env: &Env, giveaway_id: u64, winner_address: Address) {
        // In a more complete implementation, you'd search entries for this address
        // and mark the corresponding entry as winner
        // For this MVP, we're just updating the giveaway itself
        let _ = giveaway_id;
        let _ = winner_address;
        // Implementation would find the entry and update is_winner = true
    }

    // Generate unique ID using counter
    fn generate_id(env: &Env) -> u64 {
        let key = crate::types::GIVEAWAY_COUNTER;
        let mut counter: u64 = env.storage().instance().get(&key).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&key, &counter);
        counter
    }

    // Claim prize (can be called once winner is selected)
    pub fn claim_prize(env: Env, giveaway_id: u64, claimer: Address) -> bool {
        claimer.require_auth();

        let giveaway_key = GiveawayKey(giveaway_id);
        let mut giveaway: Giveaway = env
            .storage()
            .get(&giveaway_key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::GiveawayNotFound));

        // Check if giveaway is in claimable state
        if giveaway.status != GiveawayStatus::Claimable {
            panic_with_error!(&env, Error::InvalidStatus);
        }

        // Check if claimer is the winner
        if giveaway.winner.as_ref() != Some(&claimer) {
            panic_with_error!(&env, Error::NotCreator);
        }

        // Mark as completed
        giveaway.status = GiveawayStatus::Completed;
        env.storage()
            .set(&giveaway_key, &giveaway);

        true
    }
}
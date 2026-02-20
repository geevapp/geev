#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{
    types::{GiveawayStatus, SelectionMethod},
    GiveawayContract,
};

#[test]
fn test_create_giveaway() {
    let env = Env::default();
    let creator = Address::generate(&env);
    
    let giveaway_id = GiveawayContract::create_giveaway(
        env.clone(),
        creator.clone(),
        "Test Giveaway".to_string(),
        "This is a test giveaway".to_string(),
        "general".to_string(),
        SelectionMethod::Random,
        1,
        86400, // 1 day
    );
    
    assert_eq!(giveaway_id, 1);
    
    let giveaway = GiveawayContract::get_giveaway(env, giveaway_id).unwrap();
    assert_eq!(giveaway.creator, creator);
    assert_eq!(giveaway.title, "Test Giveaway");
    assert_eq!(giveaway.status, GiveawayStatus::Active);
    assert_eq!(giveaway.participant_count, 0);
    assert_eq!(giveaway.winner, None);
}

#[test]
fn test_add_participant() {
    let env = Env::default();
    let creator = Address::generate(&env);
    let participant = Address::generate(&env);
    
    // Create giveaway
    let giveaway_id = GiveawayContract::create_giveaway(
        env.clone(),
        creator.clone(),
        "Test Giveaway".to_string(),
        "This is a test giveaway".to_string(),
        "general".to_string(),
        SelectionMethod::Random,
        1,
        86400, // 1 day
    );
    
    // Add participant
    let entry_id = GiveawayContract::add_participant(
        env.clone(),
        giveaway_id,
        participant.clone(),
        "Test entry".to_string(),
    );
    
    assert_eq!(entry_id, 2); // 1 for giveaway, 2 for entry
    
    let giveaway = GiveawayContract::get_giveaway(env.clone(), giveaway_id).unwrap();
    assert_eq!(giveaway.participant_count, 1);
    
    // Check participant at index 0
    let stored_participant = GiveawayContract::get_participant_at_index(env, giveaway_id, 0).unwrap();
    assert_eq!(stored_participant, participant);
}

#[test]
fn test_pick_winner_success() {
    let env = Env::default();
    let creator = Address::generate(&env);
    let participant1 = Address::generate(&env);
    let participant2 = Address::generate(&env);
    let participant3 = Address::generate(&env);
    
    // Create giveaway
    let giveaway_id = GiveawayContract::create_giveaway(
        env.clone(),
        creator.clone(),
        "Test Giveaway".to_string(),
        "This is a test giveaway".to_string(),
        "general".to_string(),
        SelectionMethod::Random,
        1,
        1000, // 1000 seconds
    );
    
    // Add participants
    GiveawayContract::add_participant(
        env.clone(),
        giveaway_id,
        participant1.clone(),
        "Entry 1".to_string(),
    );
    GiveawayContract::add_participant(
        env.clone(),
        giveaway_id,
        participant2.clone(),
        "Entry 2".to_string(),
    );
    GiveawayContract::add_participant(
        env.clone(),
        giveaway_id,
        participant3.clone(),
        "Entry 3".to_string(),
    );
    
    // Advance time beyond end_time
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 2000; // Advance time beyond 1000 seconds
    });
    
    // Pick winner
    let winner = GiveawayContract::pick_winner(env.clone(), giveaway_id);
    
    // Winner should be one of the participants
    assert!(
        winner == participant1 || winner == participant2 || winner == participant3
    );
    
    // Check that giveaway status is updated
    let giveaway = GiveawayContract::get_giveaway(env.clone(), giveaway_id).unwrap();
    assert_eq!(giveaway.status, GiveawayStatus::Claimable);
    assert_eq!(giveaway.winner, Some(winner));
}

#[test]
#[should_panic(expected = "Error(Guest(2))")] // GiveawayStillActive
fn test_pick_winner_still_active() {
    let env = Env::default();
    let creator = Address::generate(&env);
    let participant = Address::generate(&env);
    
    // Create giveaway
    let giveaway_id = GiveawayContract::create_giveaway(
        env.clone(),
        creator.clone(),
        "Test Giveaway".to_string(),
        "This is a test giveaway".to_string(),
        "general".to_string(),
        SelectionMethod::Random,
        1,
        86400, // 1 day
    );
    
    // Add participant
    GiveawayContract::add_participant(
        env.clone(),
        giveaway_id,
        participant.clone(),
        "Test entry".to_string(),
    );
    
    // Try to pick winner before end_time (should panic)
    GiveawayContract::pick_winner(env, giveaway_id);
}

#[test]
#[should_panic(expected = "Error(Guest(3))")] // InvalidStatus
fn test_pick_winner_not_active() {
    let env = Env::default();
    let creator = Address::generate(&env);
    let participant = Address::generate(&env);
    
    // Create giveaway
    let giveaway_id = GiveawayContract::create_giveaway(
        env.clone(),
        creator.clone(),
        "Test Giveaway".to_string(),
        "This is a test giveaway".to_string(),
        "general".to_string(),
        SelectionMethod::Random,
        1,
        1000,
    );
    
    // Add participant
    GiveawayContract::add_participant(
        env.clone(),
        giveaway_id,
        participant.clone(),
        "Test entry".to_string(),
    );
    
    // Advance time
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 2000;
    });
    
    // Pick winner first time
    GiveawayContract::pick_winner(env.clone(), giveaway_id);
    
    // Try to pick winner again (should panic - already claimable)
    GiveawayContract::pick_winner(env, giveaway_id);
}

#[test]
#[should_panic(expected = "Error(Guest(4))")] // NoParticipants
fn test_pick_winner_no_participants() {
    let env = Env::default();
    let creator = Address::generate(&env);
    
    // Create giveaway
    let giveaway_id = GiveawayContract::create_giveaway(
        env.clone(),
        creator.clone(),
        "Test Giveaway".to_string(),
        "This is a test giveaway".to_string(),
        "general".to_string(),
        SelectionMethod::Random,
        1,
        1000,
    );
    
    // Advance time
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 2000;
    });
    
    // Try to pick winner with no participants (should panic)
    GiveawayContract::pick_winner(env, giveaway_id);
}

#[test]
fn test_claim_prize() {
    let env = Env::default();
    let creator = Address::generate(&env);
    let participant = Address::generate(&env);
    
    // Create giveaway
    let giveaway_id = GiveawayContract::create_giveaway(
        env.clone(),
        creator.clone(),
        "Test Giveaway".to_string(),
        "This is a test giveaway".to_string(),
        "general".to_string(),
        SelectionMethod::Random,
        1,
        1000,
    );
    
    // Add participant
    GiveawayContract::add_participant(
        env.clone(),
        giveaway_id,
        participant.clone(),
        "Test entry".to_string(),
    );
    
    // Advance time
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 2000;
    });
    
    // Pick winner
    let winner = GiveawayContract::pick_winner(env.clone(), giveaway_id);
    assert_eq!(winner, participant);
    
    // Claim prize
    let result = GiveawayContract::claim_prize(env.clone(), giveaway_id, participant.clone());
    assert!(result);
    
    // Check status is updated
    let giveaway = GiveawayContract::get_giveaway(env, giveaway_id).unwrap();
    assert_eq!(giveaway.status, GiveawayStatus::Completed);
}

#[test]
#[should_panic(expected = "Error(Guest(5))")] // NotCreator
fn test_claim_prize_wrong_claimer() {
    let env = Env::default();
    let creator = Address::generate(&env);
    let participant = Address::generate(&env);
    let wrong_claimer = Address::generate(&env);
    
    // Create giveaway
    let giveaway_id = GiveawayContract::create_giveaway(
        env.clone(),
        creator.clone(),
        "Test Giveaway".to_string(),
        "This is a test giveaway".to_string(),
        "general".to_string(),
        SelectionMethod::Random,
        1,
        1000,
    );
    
    // Add participant
    GiveawayContract::add_participant(
        env.clone(),
        giveaway_id,
        participant.clone(),
        "Test entry".to_string(),
    );
    
    // Advance time
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 2000;
    });
    
    // Pick winner
    GiveawayContract::pick_winner(env.clone(), giveaway_id);
    
    // Try to claim with wrong address (should panic)
    GiveawayContract::claim_prize(env, giveaway_id, wrong_claimer);
}

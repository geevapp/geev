# Geev Core Smart Contract

This is the core smart contract for the Geev decentralized giveaway platform, built on the Stellar blockchain using Soroban.

## Overview

The Geev Core contract enables decentralized giveaway creation and management with transparent, trustless winner selection. It implements:

- **Giveaway Creation**: Create giveaways with customizable parameters
- **Participant Registration**: Users can enter giveaways before the deadline
- **Winner Selection**: Random selection using ledger-based PRNG after giveaway ends
- **Prize Claiming**: Winners can claim their prizes once selected

## Features

### Winner Selection (MVP)
- **Random Selection**: Uses `env.prng()` for pseudo-random number generation
- **Time-based**: Can only execute after the giveaway's `end_time`
- **Status Validation**: Only works on `Active` giveaways
- **Participant Indexing**: Maintains `ParticipantIndex` mapping for efficient lookup

## Contract Structure

### Core Types

```rust
// Giveaway status states
pub enum GiveawayStatus {
    Active,      // Accepting entries
    Claimable,   // Winner selected, prize claimable
    Completed,   // Prize claimed
    Cancelled,   // Giveaway cancelled
}

// Winner selection methods
pub enum SelectionMethod {
    Random,     // Random selection (current implementation)
    FirstCome,  // First valid entries
    Manual,     // Manual selection by creator
}

// Main giveaway structure
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
```

### Storage Keys

- `GiveawayKey(u64)` - Store/retrieve giveaways by ID
- `ParticipantIndexKey(u64, u32)` - Map participant index to address
- `CounterKey` - Generate unique IDs
- `EntryKey(u64)` - Store individual entries

## Functions

### `create_giveaway`
Create a new giveaway with specified parameters.

**Parameters:**
- `creator: Address` - Creator's wallet address
- `title: String` - Giveaway title
- `description: String` - Detailed description
- `category: String` - Giveaway category
- `selection_method: SelectionMethod` - How winners are selected
- `winner_count: u32` - Number of winners
- `duration_seconds: u64` - Duration from creation time

**Returns:** `u64` - Unique giveaway ID

### `add_participant`
Add a participant to an active giveaway.

**Parameters:**
- `giveaway_id: u64` - ID of the giveaway
- `participant: Address` - Participant's wallet address
- `content: String` - Entry content/submission

**Returns:** `u64` - Unique entry ID

### `pick_winner` ⭐ (Main Feature)
Select a winner randomly when the giveaway period ends.

**Parameters:**
- `giveaway_id: u64` - ID of the giveaway

**Requirements:**
- Giveaway must be `Active`
- Current time must be after `end_time`
- Must have at least one participant

**Process:**
1. Validates giveaway status and timing
2. Generates random seed using `env.prng().gen::<u64>()`
3. Calculates winner index: `random_seed % participant_count`
4. Retrieves winner address from `ParticipantIndex`
5. Updates giveaway status to `Claimable`
6. Sets winner address in giveaway struct

**Returns:** `Address` - Winner's wallet address

### `claim_prize`
Allow winner to claim their prize.

**Parameters:**
- `giveaway_id: u64` - ID of the giveaway
- `claimer: Address` - Claimer's wallet address

**Requirements:**
- Giveaway status must be `Claimable`
- Claimer must be the selected winner

**Returns:** `bool` - Success status

### `get_giveaway`
Retrieve giveaway details by ID.

**Parameters:**
- `giveaway_id: u64` - ID of the giveaway

**Returns:** `Option<Giveaway>` - Giveaway data or None

## Usage Examples

### Creating a Giveaway
```rust
let giveaway_id = GiveawayContract::create_giveaway(
    env.clone(),
    creator_address,
    "Free NFT Giveaway".to_string(),
    "Win one of 5 exclusive NFTs!".to_string(),
    "nft".to_string(),
    SelectionMethod::Random,
    5,           // 5 winners
    86400        // 24 hours duration
);
```

### Adding Participants
```rust
let entry_id = GiveawayContract::add_participant(
    env.clone(),
    giveaway_id,
    participant_address,
    "I'd love to win this NFT!".to_string()
);
```

### Selecting Winner (After End Time)
```rust
// Advance time beyond end_time
env.ledger().with_mut(|li| {
    li.timestamp = giveaway.end_time + 1000;
});

// Select winner
let winner_address = GiveawayContract::pick_winner(env, giveaway_id);
```

### Claiming Prize
```rust
let success = GiveawayContract::claim_prize(
    env, 
    giveaway_id, 
    winner_address
);
```

## Security Considerations

### MVP Implementation Limitations
⚠️ **Randomness Source**: Uses `env.prng()` which is ledger-based but not cryptographically secure. For production, consider using a more robust randomness source.

### Key Safeguards
- **Time-based Execution**: Winner selection only possible after `end_time`
- **Status Validation**: Prevents manipulation of completed giveaways
- **Participant Count**: Ensures at least one participant exists
- **Address Authentication**: Participants must authenticate their actions

## Testing

Run contract tests with:
```bash
cargo test
```

Tests cover:
- ✅ Giveaway creation
- ✅ Participant registration
- ✅ Winner selection with proper timing
- ✅ Error handling for edge cases
- ✅ Prize claiming functionality

## Error Handling

The contract defines specific error types:
```rust
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
```

## Deployment

1. Build the contract:
```bash
soroban build
```

2. Deploy to testnet:
```bash
soroban deploy --network testnet
```

3. Deploy to local sandbox:
```bash
soroban deploy --network local
```

## Integration with Frontend

The contract is designed to integrate with the Geev frontend application:

- **API Alignment**: Contract methods mirror frontend concepts
- **Status Synchronization**: Giveaway states match frontend expectations
- **Error Compatibility**: Error codes map to user-friendly messages

## Future Enhancements

Planned improvements:
- 🔐 Cryptographically secure randomness
- 🔄 Multiple winner selection
- 📊 Merit-based selection algorithms
- ⚖️ Dispute resolution mechanisms
- 🛡️ Advanced participant verification
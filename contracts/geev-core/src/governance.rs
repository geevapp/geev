use soroban_sdk::{contract, contractevent, contractimpl, Address, Env};

use crate::types::{DataKey, Error};

#[contract]
pub struct GovernanceContract;

#[contractevent]
pub struct ContentFlagged {
    #[topic]
    target_id: u64,
    user: Address,
    count: u32,
}

#[contractimpl]
impl GovernanceContract {
    /// Flag a piece of content (Giveaway or HelpRequest) by its ID.
    /// Each user may only flag a given ID once.
    pub fn flag_content(env: Env, user: Address, target_id: u64) -> Result<(), Error> {
        // 1. Verify caller signature
        user.require_auth();

        // 2. Prevent duplicate flags from the same user
        let flag_key = DataKey::FlagRecord(target_id, user.clone());
        if env.storage().persistent().has(&flag_key) {
            return Err(Error::AlreadyFlagged);
        }

        // 3. Record that this user has flagged this ID
        env.storage().persistent().set(&flag_key, &true);

        // 4. Increment the total flag count for this ID
        let count_key = DataKey::FlagCount(target_id);
        let current: u32 = env.storage().persistent().get(&count_key).unwrap_or(0);
        let new_count = current.checked_add(1).ok_or(Error::ArithmeticOverflow)?;
        env.storage().persistent().set(&count_key, &new_count);

        // 5. Emit "ContentFlagged" event: topics = (name, target_id), data = (user, total_flags)
        ContentFlagged {
            target_id,
            user,
            count: new_count,
        }
        .publish(&env);

        Ok(())
    }

    /// Returns the total number of flags for a given content ID.
    pub fn get_flag_count(env: Env, target_id: u64) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::FlagCount(target_id))
            .unwrap_or(0)
    }

    /// Returns whether a specific user has already flagged a given content ID.
    pub fn has_flagged(env: Env, user: Address, target_id: u64) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::FlagRecord(target_id, user))
    }
}

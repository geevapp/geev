use crate::types::{DataKey, Error, GiveawayStatus, HelpRequestStatus};
use soroban_sdk::{contract, contractevent, contractimpl, Address, Env};

/// Number of flags required to automatically suspend content.
pub const FLAG_THRESHOLD: u32 = 10;

#[contract]
pub struct GovernanceContract;

#[contractevent]
pub struct ContentFlagged {
    #[topic]
    target_id: u64,
    user: Address,
    count: u32,
}

#[contractevent]
pub struct ContentAutoSuspended {
    #[topic]
    target_id: u64,
    count: u32,
}

#[contractimpl]
impl GovernanceContract {
    /// Flag a piece of content (Giveaway or HelpRequest) by its ID.
    /// Each user may only flag a given ID once.
    /// When the flag count reaches FLAG_THRESHOLD the item is automatically suspended.
    pub fn flag_content(env: Env, user: Address, target_id: u64) -> Result<(), Error> {
        // 1. Verify caller signature.
        user.require_auth();

        // 2. Prevent duplicate flags from the same user.
        let flag_key = DataKey::FlagRecord(target_id, user.clone());
        if env.storage().persistent().has(&flag_key) {
            return Err(Error::AlreadyFlagged);
        }
        env.storage().persistent().set(&flag_key, &true);

        // 3. Increment the total flag count for this ID.
        let count_key = DataKey::FlagCount(target_id);
        let current: u32 = env.storage().persistent().get(&count_key).unwrap_or(0);
        let new_count = current.checked_add(1).ok_or(Error::ArithmeticOverflow)?;
        env.storage().persistent().set(&count_key, &new_count);

        // 4. Emit ContentFlagged.
        ContentFlagged {
            target_id,
            user,
            count: new_count,
        }
        .publish(&env);

        // 5. Circuit breaker: suspend if threshold is reached.
        if new_count >= FLAG_THRESHOLD {
            Self::auto_suspend(&env, target_id, new_count);
        }

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

    // ── internal ──────────────────────────────────────────────────────────────

    /// Try to suspend the Giveaway or HelpRequest with `target_id`.
    /// Silently skips if neither exists (the ID may belong to a future content type).
    fn auto_suspend(env: &Env, target_id: u64, count: u32) {
        let giveaway_key = DataKey::Giveaway(target_id);
        let request_key = DataKey::HelpRequest(target_id);

        let mut suspended = false;

        // Try Giveaway first.
        if let Some(mut giveaway) =
            env.storage()
                .persistent()
                .get::<DataKey, crate::types::Giveaway>(&giveaway_key)
        {
            if giveaway.status == GiveawayStatus::Active {
                giveaway.status = GiveawayStatus::Suspended;
                env.storage().persistent().set(&giveaway_key, &giveaway);
                suspended = true;
            }
        }

        // Try HelpRequest if giveaway wasn't found/suspended.
        if !suspended {
            if let Some(mut request) =
                env.storage()
                    .persistent()
                    .get::<DataKey, crate::types::HelpRequest>(&request_key)
            {
                if request.status == HelpRequestStatus::Open {
                    request.status = HelpRequestStatus::Suspended;
                    env.storage().persistent().set(&request_key, &request);
                    suspended = true;
                }
            }
        }

        if suspended {
            ContentAutoSuspended { target_id, count }.publish(env);
        }
    }
}

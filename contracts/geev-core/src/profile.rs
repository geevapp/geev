use crate::types::{DataKey, Error, ProfileData};
use soroban_sdk::{contract, contractimpl, panic_with_error, Address, Env, String};

#[contract]
pub struct ProfileContract;

#[contractimpl]
impl ProfileContract {
    /// Create or update the caller's on-chain profile.
    ///
    /// * `user`        – the account whose profile is being set; must sign the tx
    /// * `username`    – desired display name (must be unique across all users)
    /// * `avatar_hash` – IPFS CID pointing to the avatar image
    pub fn set_profile(env: Env, user: Address, username: String, avatar_hash: String) {
        user.require_auth();

        let profile_key = DataKey::Profile(user.clone());
        let username_key = DataKey::Username(username.clone());

        // Enforce username uniqueness – reject if another address owns this username
        if let Some(owner) = env
            .storage()
            .persistent()
            .get::<DataKey, Address>(&username_key)
        {
            if owner != user {
                panic_with_error!(&env, Error::UsernameTaken);
            }
        }

        // Free the old username mapping when a user changes their handle
        if let Some(existing) = env
            .storage()
            .persistent()
            .get::<DataKey, ProfileData>(&profile_key)
        {
            if existing.username != username {
                env.storage()
                    .persistent()
                    .remove(&DataKey::Username(existing.username));
            }
        }

        let profile = ProfileData {
            username: username.clone(),
            avatar_hash,
        };

        env.storage().persistent().set(&profile_key, &profile);

        // Reverse mapping: Username → Address
        env.storage().persistent().set(&username_key, &user);
    }

    /// Retrieve profile data for a given wallet address.
    /// Returns `None` if no profile has been registered for that address.
    pub fn get_profile(env: Env, user: Address) -> Option<ProfileData> {
        env.storage()
            .persistent()
            .get::<DataKey, ProfileData>(&DataKey::Profile(user))
    }

    /// Reverse lookup – resolve a username to its owner's address.
    /// Returns `None` if the username is not registered.
    pub fn resolve_username(env: Env, username: String) -> Option<Address> {
        env.storage()
            .persistent()
            .get::<DataKey, Address>(&DataKey::Username(username))
    }
}

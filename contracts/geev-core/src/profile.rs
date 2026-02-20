use soroban_sdk::{contract, contractimpl, contracttype, panic_with_error, Address, Env, String};

// ── Error codes ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    UsernameTaken = 1,
}

// ── Storage keys ─────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    /// Address → ProfileData  (forward lookup)
    Profile(Address),
    /// Username → Address     (reverse lookup – enforces uniqueness)
    Username(String),
}

// ── Data types ───────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProfileData {
    pub username: String,
    pub avatar_hash: String,
}

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

        if let Some(owner) = env
            .storage()
            .persistent()
            .get::<DataKey, Address>(&username_key)
        {
            if owner != user {
                panic_with_error!(&env, Error::UsernameTaken);
            }
        }

        // ── Clean up the old username mapping ───────────────────────────────
        // If this address already has a profile with a different username,
        // remove the stale Username → Address entry so the old username is freed.
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

        // Maintain reverse mapping: Username → Address
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

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    fn make_env() -> Env {
        Env::default()
    }

    fn register(env: &Env, user: &Address, username: &str, avatar: &str) {
        env.mock_all_auths();
        let client = ProfileContractClient::new(env, &env.register_contract(None, ProfileContract));
        client.set_profile(
            user,
            &String::from_str(env, username),
            &String::from_str(env, avatar),
        );
    }

    #[test]
    fn set_and_get_profile() {
        let env = make_env();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, ProfileContract);
        let client = ProfileContractClient::new(&env, &contract_id);

        let user = Address::generate(&env);
        let username = String::from_str(&env, "alice");
        let avatar = String::from_str(&env, "QmHash123");

        client.set_profile(&user, &username, &avatar);

        let profile = client.get_profile(&user).unwrap();
        assert_eq!(profile.username, username);
        assert_eq!(profile.avatar_hash, avatar);
    }

    #[test]
    fn resolve_username_returns_owner() {
        let env = make_env();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, ProfileContract);
        let client = ProfileContractClient::new(&env, &contract_id);

        let user = Address::generate(&env);
        let username = String::from_str(&env, "bob");
        let avatar = String::from_str(&env, "QmAvatarBob");

        client.set_profile(&user, &username, &avatar);

        let resolved = client.resolve_username(&username).unwrap();
        assert_eq!(resolved, user);
    }

    #[test]
    #[should_panic]
    fn duplicate_username_rejected() {
        let env = make_env();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, ProfileContract);
        let client = ProfileContractClient::new(&env, &contract_id);

        let alice = Address::generate(&env);
        let bob = Address::generate(&env);
        let username = String::from_str(&env, "geev_user");
        let avatar = String::from_str(&env, "QmHash456");

        // Alice claims the username
        client.set_profile(&alice, &username, &avatar);

        // Bob tries to claim the same username – must panic with UsernameTaken
        client.set_profile(&bob, &username, &avatar);
    }

    #[test]
    fn user_can_change_username_and_old_one_is_freed() {
        let env = make_env();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, ProfileContract);
        let client = ProfileContractClient::new(&env, &contract_id);

        let user = Address::generate(&env);
        let old_username = String::from_str(&env, "old_name");
        let new_username = String::from_str(&env, "new_name");
        let avatar = String::from_str(&env, "QmHash789");

        // Set initial profile
        client.set_profile(&user, &old_username, &avatar);

        // Update to new username
        client.set_profile(&user, &new_username, &avatar);

        // Old username must be freed (no longer resolves)
        assert!(client.resolve_username(&old_username).is_none());

        // New username resolves to the user
        assert_eq!(client.resolve_username(&new_username).unwrap(), user);
    }

    #[test]
    fn get_profile_returns_none_for_unknown_address() {
        let env = make_env();
        let contract_id = env.register_contract(None, ProfileContract);
        let client = ProfileContractClient::new(&env, &contract_id);

        let stranger = Address::generate(&env);
        assert!(client.get_profile(&stranger).is_none());
    }
}

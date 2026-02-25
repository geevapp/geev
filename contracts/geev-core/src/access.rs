use crate::types::{DataKey, Error};
use soroban_sdk::{panic_with_error, Address, Env};

/// Check if the caller is the admin and require authentication
///
/// # Arguments
/// * `env` - The contract environment
///
/// # Returns
/// The admin address if authentication succeeds
///
/// # Panics
/// Panics with Error::NotAdmin if admin is not set or authentication fails
pub fn check_admin(env: &Env) -> Address {
    // Load Admin address from storage
    let admin_key = DataKey::Admin;
    let admin: Address = env
        .storage()
        .instance()
        .get(&admin_key)
        .unwrap_or_else(|| panic_with_error!(env, Error::NotAdmin));

    // Require Admin authentication
    admin.require_auth();

    admin
}

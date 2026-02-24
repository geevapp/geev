use soroban_sdk::{symbol_short, Env, Symbol};

const LOCK_KEY: Symbol = symbol_short!("Lock");

pub fn with_reentrancy_guard<F, T>(env: &Env, f: F) -> T
where
    F: FnOnce() -> T,
{
    if env.storage().temporary().has(&LOCK_KEY) {
        panic!("reentrancy detected");
    }
    env.storage().temporary().set(&LOCK_KEY, &true);
    let result = f();
    env.storage().temporary().remove(&LOCK_KEY);
    result
}

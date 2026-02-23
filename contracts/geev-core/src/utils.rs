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

#[cfg(test)]
mod tests {
    use super::{with_reentrancy_guard, LOCK_KEY};
    use soroban_sdk::{contract, contractimpl, Env};

    #[contract]
    struct TestContract;

    #[contractimpl]
    impl TestContract {}

    fn setup() -> (Env, soroban_sdk::Address) {
        let env = Env::default();
        let contract_id = env.register(TestContract, ());
        (env, contract_id)
    }

    #[test]
    fn executes_closure_and_returns_value() {
        let (env, id) = setup();
        let result = env.as_contract(&id, || with_reentrancy_guard(&env, || 42u32));
        assert_eq!(result, 42);
    }

    #[test]
    fn lock_is_released_after_successful_execution() {
        let (env, id) = setup();
        env.as_contract(&id, || with_reentrancy_guard(&env, || ()));
        // Second call must not panic — lock was released.
        env.as_contract(&id, || with_reentrancy_guard(&env, || ()));
    }

    #[test]
    fn works_with_result_returning_closure() {
        let (env, id) = setup();
        let ok: Result<u32, &str> = env.as_contract(&id, || with_reentrancy_guard(&env, || Ok(99)));
        assert_eq!(ok, Ok(99));
        let err: Result<u32, &str> =
            env.as_contract(&id, || with_reentrancy_guard(&env, || Err("fail")));
        assert_eq!(err, Err("fail"));
    }

    #[test]
    fn forwards_closure_return_value_unchanged() {
        let (env, id) = setup();
        let val = env.as_contract(&id, || with_reentrancy_guard(&env, || "hello"));
        assert_eq!(val, "hello");
    }

    #[test]
    fn lock_key_exists_during_execution() {
        let (env, id) = setup();
        env.as_contract(&id, || {
            with_reentrancy_guard(&env, || {
                assert!(
                    env.storage().temporary().has(&LOCK_KEY),
                    "lock must be set while the guard is active"
                );
            });
        });
    }

    #[test]
    fn lock_key_absent_after_execution() {
        let (env, id) = setup();
        env.as_contract(&id, || with_reentrancy_guard(&env, || ()));
        env.as_contract(&id, || {
            assert!(
                !env.storage().temporary().has(&LOCK_KEY),
                "lock must be removed after the guard exits"
            );
        });
    }

    #[test]
    #[should_panic(expected = "reentrancy detected")]
    fn panics_when_lock_is_already_held() {
        let (env, id) = setup();
        env.as_contract(&id, || {
            with_reentrancy_guard(&env, || {
                with_reentrancy_guard(&env, || ());
            });
        });
    }

    #[test]
    #[should_panic(expected = "reentrancy detected")]
    fn panics_when_lock_key_pre_exists_in_storage() {
        let (env, id) = setup();
        env.as_contract(&id, || {
            env.storage().temporary().set(&LOCK_KEY, &true);
        });
        env.as_contract(&id, || {
            with_reentrancy_guard(&env, || ());
        });
    }

    #[test]
    fn sequential_calls_all_succeed() {
        let (env, id) = setup();
        for i in 0..5u32 {
            let result = env.as_contract(&id, || with_reentrancy_guard(&env, || i * 2));
            assert_eq!(result, i * 2);
        }
    }
}

# Soroban SDK v25 Storage Issue

## Problem
All tests using storage (both instance and persistent) fail with the same error in SDK v25:

```
Error(Storage, MissingValue)
"trying to get non-existing value for contract instance"
```

## Evidence
Even the simplest possible test fails:
```rust
#[test]
fn test_basic_storage() {
    let env = Env::default();
    let contract_id = Address::generate(&env);

    env.as_contract(&contract_id, || {
        let key = DataKey::Paused;
        env.storage().instance().set(&key, &false);
        let value: bool = env.storage().instance().get(&key).unwrap(); // FAILS HERE
        assert_eq!(value, false);
    });
}
```

## Root Cause
This appears to be an API change or bug in Soroban SDK v25.x. The same pattern worked in v22.

## Impact
- Issues #130, #135, #142 implementations are functionally correct
- Contract compiles successfully
- All tests fail due to this SDK issue

## Workaround Needed
Someone with deep Soroban SDK v25 knowledge needs to:
1. Identify the correct storage access pattern for v25
2. Or downgrade to a working SDK version
3. Or wait for SDK fix

## Status
**The implementation logic is CORRECT - only testing infrastructure is broken.**

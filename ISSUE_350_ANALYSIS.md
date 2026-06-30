# Issue #350: Withdrawal sends USD ledger balance one-to-one as XLM with no currency conversion

## Problem Analysis

### Current Behavior
The simulated ledger stores funding in USD (`currency: "USD"`), but when withdrawing:
1. User's wallet balance is stored in USD (e.g., "100 USD")
2. On-chain withdrawal sends the SAME AMOUNT as XLM (e.g., "100 XLM")
3. This creates a 1:1 mapping with no currency conversion
4. Results in massive value discrepancy ($100 USD ≠ 100 XLM)

### Code Locations
- **Withdrawal Route**: `app/api/wallet/withdraw/route.ts`
  - Line 124: Creates transaction with `currency: "USD"` for simulated withdrawals
  - Line 62-64: For on-chain withdrawals, uses amount directly without conversion

- **Stellar Library**: `lib/stellar.ts`
  - Line 86-88: Builds payment using raw amount without conversion

- **Wallet Component**: `components/wallet-management.tsx`
  - Displays balance as `$` which implies USD

## Root Cause
1. **No exchange rate handling** - System doesn't track USD to XLM conversion rate
2. **Hard-coded USD currency** - Simulated withdrawals hardcode "USD" but on-chain uses XLM
3. **Amount passed directly** - Withdrawal amount not converted when submitting to Stellar
4. **No source-of-truth for conversion** - Missing logic to either:
   - Store conversion rate and convert amounts, OR
   - Normalize everything to one currency (XLM)

## Solution Approach

### Option A: Implement USD to XLM Conversion (Recommended)
1. Add `getUSDtoXLMRate()` function to fetch current exchange rate
2. Convert amount when submitting on-chain withdrawal
3. Store original currency and converted amount in transaction record
4. Update transaction schema to track `originalCurrency` and `originalAmount`

### Option B: Normalize to XLM Only
1. Convert all USD deposits to XLM immediately
2. Store everything as XLM internally
3. Convert to USD for display only
4. Simpler but removes USD value tracking

### Option C: Denominate in USD with Decimal Conversion
1. Keep USD as base currency
2. Convert to XLM only for on-chain operations
3. Store both amounts in ledger for audit trail

## Recommended Implementation (Option A)

### Files to Modify
1. `lib/stellar.ts` - Add exchange rate function
2. `app/api/wallet/withdraw/route.ts` - Apply conversion logic
3. `app/api/wallet/fund/route.ts` - Store currency info
4. Schema migration - Add currency tracking to WalletTransaction

### Implementation Steps
1. Create `getExchangeRate(from: string, to: string)` in stellar.ts
2. Update withdrawal route to call conversion before Stellar submission
3. Store `originalAmount`, `originalCurrency`, `convertedAmount` in transaction
4. Add validation to ensure XLM amount is correctly calculated
5. Update tests to verify conversion accuracy

### Data Structure Change
```typescript
// Current
{
  id: string;
  amount: number;
  currency: "USD"; // Always USD for simulated
  // ...
}

// New
{
  id: string;
  amount: number; // XLM amount for on-chain
  currency: string; // "XLM" or "USD"
  originalAmount: number; // Original amount before conversion
  originalCurrency: string; // Original currency
  exchangeRate?: number; // Applied rate for audit
  // ...
}
```

## Testing Strategy
1. Test USD to XLM conversion with known rates
2. Verify on-chain amounts match conversion
3. Ensure transaction history shows both original and converted amounts
4. Validate edge cases (very small amounts, rounding)

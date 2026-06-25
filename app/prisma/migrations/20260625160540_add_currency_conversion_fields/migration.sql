-- Add currency conversion fields to WalletTransaction
-- This allows tracking of USD -> XLM conversions and vice versa

-- Add new columns for conversion tracking
ALTER TABLE "wallet_transactions" ADD COLUMN "converted_amount" DOUBLE PRECISION;
ALTER TABLE "wallet_transactions" ADD COLUMN "converted_currency" VARCHAR(10);
ALTER TABLE "wallet_transactions" ADD COLUMN "exchange_rate" DOUBLE PRECISION;

-- Add comment to existing currency column for clarity
-- The 'currency' field now represents the original currency before any conversion

-- Create an index on converted_currency for quick lookups
CREATE INDEX "wallet_transactions_converted_currency_idx" ON "wallet_transactions"("converted_currency");

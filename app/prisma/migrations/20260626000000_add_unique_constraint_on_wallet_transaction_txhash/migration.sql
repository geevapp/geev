-- Add unique constraint on txHash to prevent replay attacks
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_txHash_key" UNIQUE ("txHash");

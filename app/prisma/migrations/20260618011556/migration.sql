-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('giveaway_entry', 'giveaway_win', 'help_contribution', 'post_closed', 'badge_awarded', 'rank_up');

-- CreateEnum
CREATE TYPE "GiveawayOnChainStatus" AS ENUM ('ACTIVE', 'CLAIMABLE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HelpRequestOnChainStatus" AS ENUM ('OPEN', 'FULLY_FUNDED', 'CLOSED', 'CANCELLED');

-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "stellarAddress" TEXT,
ADD COLUMN     "txHash" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "used_challenges" (
    "id" TEXT NOT NULL,
    "transaction_hash" VARCHAR(128) NOT NULL,
    "public_key" VARCHAR(56) NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "used_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexer_state" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "last_ledger_seq" INTEGER NOT NULL,
    "contract_id" VARCHAR(70) NOT NULL,
    "network" VARCHAR(20) NOT NULL DEFAULT 'testnet',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexer_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "on_chain_giveaways" (
    "id" TEXT NOT NULL,
    "giveaway_id" BIGINT NOT NULL,
    "creator_address" VARCHAR(70) NOT NULL,
    "token_address" VARCHAR(70) NOT NULL,
    "amount" DECIMAL(30,7) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "participant_count" INTEGER NOT NULL DEFAULT 0,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "GiveawayOnChainStatus" NOT NULL DEFAULT 'ACTIVE',
    "winner_address" VARCHAR(70),
    "tx_hash" VARCHAR(128),
    "ledger_seq" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "on_chain_giveaways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "on_chain_help_requests" (
    "id" TEXT NOT NULL,
    "request_id" BIGINT NOT NULL,
    "creator_address" VARCHAR(70) NOT NULL,
    "token_address" VARCHAR(70) NOT NULL,
    "goal" DECIMAL(30,7) NOT NULL,
    "raised_amount" DECIMAL(30,7) NOT NULL DEFAULT 0,
    "status" "HelpRequestOnChainStatus" NOT NULL DEFAULT 'OPEN',
    "tx_hash" VARCHAR(128),
    "ledger_seq" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "on_chain_help_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "on_chain_donations" (
    "id" TEXT NOT NULL,
    "donation_id" VARCHAR(128) NOT NULL,
    "request_id" BIGINT NOT NULL,
    "donor_address" VARCHAR(70) NOT NULL,
    "amount" DECIMAL(30,7) NOT NULL,
    "tx_hash" VARCHAR(128) NOT NULL,
    "ledger_seq" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "on_chain_donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_events" (
    "id" TEXT NOT NULL,
    "event_id" VARCHAR(128) NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "tx_hash" VARCHAR(128) NOT NULL,
    "ledger_seq" INTEGER NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_nonces" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_nonces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE UNIQUE INDEX "used_challenges_transaction_hash_key" ON "used_challenges"("transaction_hash");

-- CreateIndex
CREATE INDEX "used_challenges_transaction_hash_idx" ON "used_challenges"("transaction_hash");

-- CreateIndex
CREATE INDEX "used_challenges_public_key_idx" ON "used_challenges"("public_key");

-- CreateIndex
CREATE INDEX "used_challenges_used_at_idx" ON "used_challenges"("used_at");

-- CreateIndex
CREATE UNIQUE INDEX "on_chain_giveaways_giveaway_id_key" ON "on_chain_giveaways"("giveaway_id");

-- CreateIndex
CREATE INDEX "on_chain_giveaways_giveaway_id_idx" ON "on_chain_giveaways"("giveaway_id");

-- CreateIndex
CREATE INDEX "on_chain_giveaways_creator_address_idx" ON "on_chain_giveaways"("creator_address");

-- CreateIndex
CREATE INDEX "on_chain_giveaways_status_idx" ON "on_chain_giveaways"("status");

-- CreateIndex
CREATE INDEX "on_chain_giveaways_ledger_seq_idx" ON "on_chain_giveaways"("ledger_seq");

-- CreateIndex
CREATE UNIQUE INDEX "on_chain_help_requests_request_id_key" ON "on_chain_help_requests"("request_id");

-- CreateIndex
CREATE INDEX "on_chain_help_requests_request_id_idx" ON "on_chain_help_requests"("request_id");

-- CreateIndex
CREATE INDEX "on_chain_help_requests_creator_address_idx" ON "on_chain_help_requests"("creator_address");

-- CreateIndex
CREATE INDEX "on_chain_help_requests_status_idx" ON "on_chain_help_requests"("status");

-- CreateIndex
CREATE INDEX "on_chain_help_requests_ledger_seq_idx" ON "on_chain_help_requests"("ledger_seq");

-- CreateIndex
CREATE UNIQUE INDEX "on_chain_donations_donation_id_key" ON "on_chain_donations"("donation_id");

-- CreateIndex
CREATE INDEX "on_chain_donations_request_id_idx" ON "on_chain_donations"("request_id");

-- CreateIndex
CREATE INDEX "on_chain_donations_donor_address_idx" ON "on_chain_donations"("donor_address");

-- CreateIndex
CREATE INDEX "on_chain_donations_ledger_seq_idx" ON "on_chain_donations"("ledger_seq");

-- CreateIndex
CREATE UNIQUE INDEX "processed_events_event_id_key" ON "processed_events"("event_id");

-- CreateIndex
CREATE INDEX "processed_events_event_id_idx" ON "processed_events"("event_id");

-- CreateIndex
CREATE INDEX "processed_events_event_type_idx" ON "processed_events"("event_type");

-- CreateIndex
CREATE INDEX "processed_events_ledger_seq_idx" ON "processed_events"("ledger_seq");

-- CreateIndex
CREATE UNIQUE INDEX "auth_nonces_nonce_key" ON "auth_nonces"("nonce");

-- CreateIndex
CREATE INDEX "auth_nonces_nonce_idx" ON "auth_nonces"("nonce");

-- CreateIndex
CREATE INDEX "auth_nonces_expires_at_idx" ON "auth_nonces"("expires_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "on_chain_donations" ADD CONSTRAINT "on_chain_donations_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "on_chain_help_requests"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'moderator', 'admin');

-- CreateEnum
CREATE TYPE "FlagReason" AS ENUM ('spam', 'harassment', 'abusive_language', 'misinformation', 'illegal_content', 'off_topic', 'scam', 'other');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('none', 'flagged', 'under_review', 'suspended', 'banned', 'approved');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'user';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "content_flags" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "flagged_by_id" TEXT NOT NULL,
    "reason" "FlagReason" NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "moderator_id" TEXT NOT NULL,
    "action" "ModerationStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_flags_post_id_flagged_by_id_key" ON "content_flags"("post_id", "flagged_by_id");

-- CreateIndex
CREATE INDEX "content_flags_post_id_idx" ON "content_flags"("post_id");

-- CreateIndex
CREATE INDEX "content_flags_flagged_by_id_idx" ON "content_flags"("flagged_by_id");

-- CreateIndex
CREATE INDEX "content_flags_reason_idx" ON "content_flags"("reason");

-- CreateIndex
CREATE INDEX "moderation_actions_post_id_idx" ON "moderation_actions"("post_id");

-- CreateIndex
CREATE INDEX "moderation_actions_moderator_id_idx" ON "moderation_actions"("moderator_id");

-- CreateIndex
CREATE INDEX "moderation_actions_action_idx" ON "moderation_actions"("action");

-- CreateIndex
CREATE INDEX "moderation_actions_created_at_idx" ON "moderation_actions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_moderation_status_idx" ON "posts"("moderation_status");

-- AddForeignKey
ALTER TABLE "content_flags" ADD CONSTRAINT "content_flags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_flags" ADD CONSTRAINT "content_flags_flagged_by_id_fkey" FOREIGN KEY ("flagged_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - The values [closed] on the enum `PostStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `category` on the `posts` table. All the data in the column will be lost.
  - Added the required column `postRequirementsId` to the `posts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BadgeTier" AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "HelpType" AS ENUM ('material', 'service', 'advice', 'other');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('image', 'link');

-- AlterEnum
BEGIN;
CREATE TYPE "PostStatus_new" AS ENUM ('open', 'in_progress', 'completed', 'cancelled', 'active', 'expired');
ALTER TABLE "public"."posts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "posts" ALTER COLUMN "status" TYPE "PostStatus_new" USING ("status"::text::"PostStatus_new");
ALTER TYPE "PostStatus" RENAME TO "PostStatus_old";
ALTER TYPE "PostStatus_new" RENAME TO "PostStatus";
DROP TYPE "public"."PostStatus_old";
ALTER TABLE "posts" ALTER COLUMN "status" SET DEFAULT 'open';
COMMIT;

-- AlterEnum
ALTER TYPE "SelectionMethod" ADD VALUE 'merit_based';

-- DropIndex
DROP INDEX "posts_category_idx";

-- AlterTable
ALTER TABLE "entries" ADD COLUMN     "proof_image" TEXT;

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "category",
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "help_type" "HelpType",
ADD COLUMN     "max_winners" INTEGER,
ADD COLUMN     "postRequirementsId" TEXT NOT NULL,
ADD COLUMN     "urgency" "Urgency";

-- CreateTable
CREATE TABLE "PostRequirements" (
    "id" TEXT NOT NULL,
    "minBadgeTier" "BadgeTier",
    "minReputation" INTEGER,
    "proofRequired" BOOLEAN NOT NULL,

    CONSTRAINT "PostRequirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostWinner" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "PostWinner_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "Burn" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entry_id" TEXT,
    "post_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Burn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofData" (
    "id" TEXT NOT NULL,
    "type" "ProofType" NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "entryId" TEXT NOT NULL,

    CONSTRAINT "ProofData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProofData_entryId_key" ON "ProofData"("entryId");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_postRequirementsId_fkey" FOREIGN KEY ("postRequirementsId") REFERENCES "PostRequirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostWinner" ADD CONSTRAINT "PostWinner_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostWinner" ADD CONSTRAINT "PostWinner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Burn" ADD CONSTRAINT "Burn_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Burn" ADD CONSTRAINT "Burn_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofData" ADD CONSTRAINT "ProofData_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

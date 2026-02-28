-- DropForeignKey
ALTER TABLE "user_badges" DROP CONSTRAINT "user_badges_badge_id_fkey";

-- AlterTable
ALTER TABLE "badges" ALTER COLUMN "tier" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

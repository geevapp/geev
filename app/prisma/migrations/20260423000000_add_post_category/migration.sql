-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM (
  'electronics',
  'clothing',
  'books',
  'furniture',
  'toys',
  'food',
  'sports',
  'beauty',
  'automotive',
  'other'
);

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "category" "PostCategory";

-- CreateIndex
CREATE INDEX "posts_category_idx" ON "posts"("category");

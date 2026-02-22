/*
  Warnings:

  - Added the required column `slug` to the `posts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "slug" TEXT NOT NULL;

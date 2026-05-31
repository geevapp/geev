import "dotenv/config";

import { afterAll, beforeAll, beforeEach } from "vitest";

import { prisma } from "@/lib/prisma";

// Auto-enable mock mode for non-test databases to prevent accidental data loss
// This must run at module load time, before any test files are evaluated
if (
  process.env.MOCK_DB !== "true" &&
  !process.env.DATABASE_URL?.includes("test")
) {
  console.warn(
    '⚠️  DATABASE_URL does not contain "test". Running tests in MOCK_DB mode.',
  );
  process.env.MOCK_DB = "true";
}

beforeAll(async () => {
  if (process.env.MOCK_DB === "true") return;
});

afterAll(async () => {
  if (process.env.MOCK_DB === "true") return;
  await prisma.$disconnect();
});

beforeEach(async () => {
  if (process.env.MOCK_DB === "true") return;
  await prisma.interaction.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.badge.deleteMany();
});

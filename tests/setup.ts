import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

beforeAll(async () => {
  if (process.env.MOCK_DB === 'true') return;
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Tests must use a test database');
  }
});

afterAll(async () => {
  if (process.env.MOCK_DB === 'true') return;
  await prisma.$disconnect();
});

beforeEach(async () => {
  if (process.env.MOCK_DB === 'true') return;
  await prisma.interaction.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.badge.deleteMany();
});

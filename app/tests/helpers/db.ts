import { prisma } from '@/lib/prisma';
import type { User, Post } from '@prisma/client';
import { Prisma } from '@prisma/client';

export async function createTestUser(overrides?: Partial<User>): Promise<User> {
  return await prisma.user.create({
    data: {
      walletAddress: `G${Math.random().toString(36).substring(7).toUpperCase()}`,
      name: 'Test User',
      bio: 'Test bio',
      xp: 0,
      ...overrides,
    },
  });
}

export async function createTestPost(
  userId: string,
  overrides?: Partial<Post>,
): Promise<Post> {
  return await prisma.post.create({
    data: {
      creatorId: userId,
      type: 'giveaway',
      title: 'Test Giveaway Post',
      description:
        'This is a test description for a giveaway post. It needs to be at least 50 characters long.',
      category: 'electronics',
      status: 'open',
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      media: Prisma.JsonNull as any,
      ...overrides,
    },
  });
}

export async function seedTestDatabase() {
  const user1 = await createTestUser({
    name: 'Alice',
    walletAddress: 'GALICE123',
    xp: 100,
  });

  const user2 = await createTestUser({
    name: 'Bob',
    walletAddress: 'GBOB456',
    xp: 50,
  });

  const post1 = await createTestPost(user1.id, {
    title: 'Gaming Laptop Giveaway',
    category: 'electronics',
  });

  const post2 = await createTestPost(user2.id, {
    type: 'request',
    title: 'Need Help with Moving',
    category: 'services',
  });

  return { users: [user1, user2], posts: [post1, post2] };
}

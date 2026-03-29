import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as likePost, DELETE as unlikePost } from '@/app/api/posts/[id]/like/route';
import { POST as burnPost, DELETE as unburnPost } from '@/app/api/posts/[id]/burn/route';
import { GET as getStats } from '@/app/api/posts/[id]/stats/route';

const mockAwardXp = vi.hoisted(() => vi.fn());

// Mock dependencies
const mockPrisma = vi.hoisted(() => {
  const prisma = {
    $transaction: vi.fn(),
    interaction: {
      upsert: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    entry: {
      count: vi.fn(),
    },
    post: {
      findUnique: vi.fn(),
    },
  };

  prisma.$transaction.mockImplementation(async (callback: any) => callback(prisma));

  return prisma;
});

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/xp', () => ({
  awardXp: mockAwardXp,
  XP_REWARDS: {
    createGiveawayPost: 50,
    createHelpRequest: 20,
    enterGiveaway: 10,
    receiveTenLikes: 25,
  },
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth';

// Helper to create request
function createRequest(method = 'GET') {
  return new Request('http://localhost:3000', { method });
}

describe('Interactions API (Unit)', () => {
  const mockUser = { id: 'user-1' };
  const postId = 'post-1';
  const params = Promise.resolve({ id: postId });

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUser as any).mockResolvedValue(mockUser);
    mockAwardXp.mockResolvedValue({
      awarded: true,
      amount: 25,
      reason: 'post_received_10_likes',
      xp: 25,
      rankId: 'newcomer',
    });
    mockPrisma.$transaction.mockImplementation(async (callback: any) => callback(mockPrisma));
  });

  describe('Like API', () => {
    it('should like a post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: postId,
        userId: 'author-1',
      });
      mockPrisma.interaction.upsert.mockResolvedValue({});
      mockPrisma.interaction.count.mockResolvedValue(10);

      const request = createRequest('POST');
      const response = await likePost(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.liked).toBe(true);
      expect(data.data.count).toBe(10);
      
      expect(mockPrisma.interaction.upsert).toHaveBeenCalledWith({
        where: {
          userId_postId_type: {
            userId: mockUser.id,
            postId,
            type: 'like',
          },
        },
        update: {},
        create: {
          userId: mockUser.id,
          postId,
          type: 'like',
        },
      });
      expect(mockAwardXp).toHaveBeenCalledWith(
        'author-1',
        25,
        'post_received_10_likes',
        expect.objectContaining({
          dedupeKey: `post_10_likes:${postId}`,
        }),
        expect.anything(),
      );
    });

    it('should return 401 if not authorized', async () => {
      (getCurrentUser as any).mockResolvedValue(null);
      const request = createRequest('POST');
      const response = await likePost(request as any, { params });
      expect(response.status).toBe(401);
    });

    it('should return 404 when liking a missing post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      const request = createRequest('POST');
      const response = await likePost(request as any, { params });

      expect(response.status).toBe(404);
    });

    it('should unlike a post', async () => {
      mockPrisma.interaction.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.interaction.count.mockResolvedValue(9);

      const request = createRequest('DELETE');
      const response = await unlikePost(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.liked).toBe(false);
      expect(data.data.count).toBe(9);

      expect(mockPrisma.interaction.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          postId,
          type: 'like',
        },
      });
    });
  });

  describe('Burn API', () => {
    it('should burn a post', async () => {
      mockPrisma.interaction.upsert.mockResolvedValue({});
      mockPrisma.interaction.count.mockResolvedValue(5);

      const request = createRequest('POST');
      const response = await burnPost(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.burned).toBe(true);
      expect(data.data.count).toBe(5);

      expect(mockPrisma.interaction.upsert).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({ type: 'burn' })
      }));
    });

    it('should unburn a post', async () => {
      mockPrisma.interaction.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.interaction.count.mockResolvedValue(4);

      const request = createRequest('DELETE');
      const response = await unburnPost(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.burned).toBe(false);
      expect(data.data.count).toBe(4);
    });
  });

  describe('Stats API', () => {
    it('should return stats', async () => {
      mockPrisma.interaction.count.mockImplementation((args: any) => {
        if (args.where.type === 'like') return Promise.resolve(10);
        if (args.where.type === 'burn') return Promise.resolve(2);
        return Promise.resolve(0);
      });
      mockPrisma.entry.count.mockResolvedValue(5);

      const request = createRequest('GET');
      const response = await getStats(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual({
        likes: 10,
        burns: 2,
        entries: 5,
      });
    });
  });
});

import { apiError, apiSuccess } from '@/lib/api-response';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/users/[id]/activity/route';
import { prisma } from '@/lib/prisma';

// Mock prisma and api-response
vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: { findMany: vi.fn() },
    entry: { findMany: vi.fn() },
    interaction: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/api-response', () => ({
  apiSuccess: vi.fn((payload) => ({ ok: true, payload })),
  apiError: vi.fn((message, status) => ({ ok: false, error: message, status })),
}));

describe('GET /api/users/[id]/activity', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns merged activity sorted and paginated', async () => {
    // Setup mock data
    (prisma.post.findMany as any).mockResolvedValue([
      { id: 'p1', title: 'Post 1', slug: 'post-1', createdAt: new Date('2026-01-10T10:00:00Z') },
    ]);
    (prisma.entry.findMany as any).mockImplementation(({ where }) => {
      if (where?.isWinner) {
        return Promise.resolve([
          { id: 'e2', createdAt: new Date('2026-01-11T12:00:00Z'), postId: 'p2', post: { id: 'p2', title: 'Post 2', slug: 'post-2' } },
        ]);
      }
      return Promise.resolve([
        { id: 'e1', createdAt: new Date('2026-01-09T09:00:00Z'), postId: 'p1', post: { id: 'p1', title: 'Post 1', slug: 'post-1' } },
      ]);
    });
    (prisma.interaction.findMany as any).mockResolvedValue([
      { id: 'i1', createdAt: new Date('2026-01-12T08:00:00Z'), postId: 'p3', post: { id: 'p3', title: 'Post 3', slug: 'post-3' } },
    ]);

    const request = new Request('http://localhost/api/users/user-1/activity?page=1&limit=2');

    const params = { params: Promise.resolve({ id: 'user-1' }) };

    // @ts-ignore - calling the handler directly with Request and params
    const res = await GET(request as any, params as any);

    // apiSuccess should have been called with payload containing the 'activity' array
    expect(apiSuccess).toHaveBeenCalled();
    const calledWith = (apiSuccess as any).mock.calls[0][0];
    expect(calledWith.page).toBe(1);
    expect(calledWith.limit).toBe(2);
    expect(calledWith.total).toBe(4); // p1, e1, e2(won), i1
    expect(calledWith.activity.length).toBe(2); // limit=2
    // newest item (interaction at 2026-01-12) should be first
    expect(calledWith.activity[0].type).toBe('liked');
    expect(calledWith.activity[0].subject.title).toBe('Post 3');
  });
});
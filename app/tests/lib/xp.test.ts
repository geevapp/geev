import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
}));

const mockTx = vi.hoisted(() => ({
  user: {
    update: vi.fn(),
  },
  rank: {
    findFirst: vi.fn(),
  },
  analyticsEvent: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { awardXp } from '@/lib/xp';

describe('awardXp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) => callback(mockTx));
  });

  it('increments XP, updates rank, and records an analytics event', async () => {
    mockTx.analyticsEvent.findFirst.mockResolvedValue(null);
    mockTx.user.update
      .mockResolvedValueOnce({
        xp: 250,
        rankId: 'newcomer',
      })
      .mockResolvedValueOnce({
        xp: 250,
        rankId: 'helper',
      });
    mockTx.rank.findFirst.mockResolvedValue({ id: 'helper' });
    mockTx.analyticsEvent.create.mockResolvedValue({ id: 'event_1' });

    const result = await awardXp('user_1', 50, 'giveaway_post_created', {
      metadata: {
        postId: 'post_1',
      },
    });

    expect(result).toEqual({
      awarded: true,
      amount: 50,
      reason: 'giveaway_post_created',
      xp: 250,
      rankId: 'helper',
    });
    expect(mockTx.user.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'user_1' },
      data: {
        xp: {
          increment: 50,
        },
      },
      select: {
        xp: true,
        rankId: true,
      },
    });
    expect(mockTx.user.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'user_1' },
      data: {
        rankId: 'helper',
      },
      select: {
        xp: true,
        rankId: true,
      },
    });
    expect(mockTx.analyticsEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'user_1',
        eventType: 'xp_awarded',
      }),
    }));
  });

  it('does not award duplicate XP when a dedupe key already exists', async () => {
    mockTx.analyticsEvent.findFirst.mockResolvedValue({ id: 'event_1' });

    const result = await awardXp('user_1', 25, 'post_received_10_likes', {
      dedupeKey: 'post_10_likes:post_1',
    });

    expect(result).toEqual({
      awarded: false,
      amount: 0,
      reason: 'post_received_10_likes',
      xp: null,
      rankId: null,
    });
    expect(mockTx.user.update).not.toHaveBeenCalled();
    expect(mockTx.analyticsEvent.create).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseResponse } from '../helpers/api';

// Must be hoisted so they are available before module imports are resolved
const mockAuth = vi.hoisted(() => vi.fn());

const mockPrismaUser = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { user: mockPrismaUser },
}));

import { GET } from '@/app/(auth)/me/route';

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when no session exists', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();
    const { status, data } = await parseResponse(response);

    expect(status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const response = await GET();
    const { status, data } = await parseResponse(response);

    expect(status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 404 when authenticated session user is not found in DB', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'ghost_user' } });
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const response = await GET();
    const { status, data } = await parseResponse(response);

    expect(status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('User not found');
  });

  it('should return current user when session is valid', async () => {
    const mockUser = {
      id: 'user_1',
      walletAddress: 'GWALLET123',
      name: 'Test User',
      bio: 'Test bio',
      xp: 100,
      badges: [],
      rank: {
        id: 'newcomer',
        level: 1,
        title: 'Newcomer',
        color: 'text-gray-500',
        minPoints: 0,
        maxPoints: 199,
      },
      _count: {
        posts: 3,
        entries: 2,
        comments: 5,
        interactions: 10,
        badges: 1,
        analyticsEvents: 0,
        followings: 4,
        followers: 6,
        helpContributions: 0,
        accounts: 1,
        sessions: 1,
      },
    };

    mockAuth.mockResolvedValue({ user: { id: 'user_1' } });
    mockPrismaUser.findUnique.mockResolvedValue(mockUser);

    const response = await GET();
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('user_1');
    expect(data.data.walletAddress).toBe('GWALLET123');
    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user_1' } }),
    );
  });

  it('should fall back to default newcomer rank when user has no rank', async () => {
    const mockUser = {
      id: 'user_2',
      walletAddress: 'GNEWBIE',
      name: 'Newbie',
      bio: null,
      xp: 0,
      badges: [],
      rank: null,
      _count: {
        posts: 0,
        entries: 0,
        comments: 0,
        interactions: 0,
        badges: 0,
        analyticsEvents: 0,
        followings: 0,
        followers: 0,
        helpContributions: 0,
        accounts: 1,
        sessions: 1,
      },
    };

    mockAuth.mockResolvedValue({ user: { id: 'user_2' } });
    mockPrismaUser.findUnique.mockResolvedValue(mockUser);

    const response = await GET();
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.data.rank).toEqual(
      expect.objectContaining({ id: 'newcomer', level: 1, title: 'Newcomer' }),
    );
  });

  it('should flatten badges from userBadge join table', async () => {
    const mockBadge = { id: 'badge_1', name: 'Early Adopter', description: 'Joined early' };
    const mockUser = {
      id: 'user_3',
      walletAddress: 'GBADGE',
      name: 'Badge User',
      bio: null,
      xp: 200,
      badges: [{ badge: mockBadge, awardedAt: new Date('2024-01-01') }],
      rank: null,
      _count: {
        posts: 1,
        entries: 0,
        comments: 0,
        interactions: 0,
        badges: 1,
        analyticsEvents: 0,
        followings: 0,
        followers: 0,
        helpContributions: 0,
        accounts: 1,
        sessions: 1,
      },
    };

    mockAuth.mockResolvedValue({ user: { id: 'user_3' } });
    mockPrismaUser.findUnique.mockResolvedValue(mockUser);

    const response = await GET();
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.data.badges).toHaveLength(1);
    expect(data.data.badges[0].id).toBe('badge_1');
    expect(data.data.badges[0].name).toBe('Early Adopter');
    expect(data.data.badges[0].awardedAt).toBeDefined();
  });
});

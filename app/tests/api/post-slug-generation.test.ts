import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
  post: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  postRequirements: {
    create: vi.fn(),
  },
}));

const mockGetCurrentUser = vi.hoisted(() => vi.fn());
const mockAwardXp = vi.hoisted(() => vi.fn());

vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest extends Request {
    cookies = {
      set: vi.fn(),
    };
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock('@/lib/xp', () => ({
  awardXp: mockAwardXp,
  XP_REWARDS: {
    createGiveawayPost: 50,
    createHelpRequest: 20,
  },
}));

import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/posts/route';

function createMockRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function parseResponse(response: Response) {
  return {
    status: response.status,
    data: await response.json(),
  };
}

describe('POST /api/posts slug generation', () => {
  const testUser = {
    id: 'user_123',
    walletAddress: '0x123',
    name: 'Test User',
    bio: 'Test bio',
    xp: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetCurrentUser.mockResolvedValue(testUser);
    mockAwardXp.mockResolvedValue({
      awarded: true,
      amount: 50,
      reason: 'giveaway_post_created',
      xp: 50,
      rankId: 'newcomer',
    });
    prisma.$transaction.mockImplementation(async (callback: any) => callback(prisma));
    prisma.post.findFirst.mockResolvedValue(null);
    prisma.postRequirements.create.mockResolvedValue({
      id: 'requirements_123',
      proofRequired: false,
    });
    prisma.post.create.mockImplementation((args: any) => Promise.resolve({
      id: 'post_123',
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: testUser,
    }));
  });

  it('adds a short suffix when the base slug already exists', async () => {
    const postData = {
      title: 'Duplicate Giveaway Title',
      description:
        'This is a test post description with enough characters to pass validation rules.',
      type: 'giveaway',
      winnerCount: 1,
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    prisma.post.findFirst
      .mockResolvedValueOnce({ id: 'existing_post' })
      .mockResolvedValueOnce(null);

    const request = createMockRequest('http://localhost:3000/api/posts', postData);

    const response = await POST(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(201);
    expect(data.data.slug).toMatch(/^duplicate-giveaway-title-[a-z0-9]{6}$/);
    expect(prisma.post.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        slug: expect.stringMatching(/^duplicate-giveaway-title-[a-z0-9]{6}$/),
      }),
    }));
  });

  it('returns 409 when prisma reports a slug uniqueness conflict', async () => {
    const postData = {
      title: 'Another Duplicate Giveaway Title',
      description:
        'This is another test post description with enough characters to pass validation rules.',
      type: 'giveaway',
      winnerCount: 1,
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    prisma.post.create.mockRejectedValue({ code: 'P2002' });

    const request = createMockRequest('http://localhost:3000/api/posts', postData);

    const response = await POST(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(409);
    expect(data.error).toBe('A post with a conflicting slug already exists. Please retry your request.');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, parseResponse } from '../helpers/api';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  follow: {
    findUnique: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  auth: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth';
import { GET, PATCH } from '@/app/api/users/[id]/route';

describe('Users API', () => {
  const user1 = {
    id: 'user_1',
    walletAddress: 'GUSER1WALLET',
    name: 'Alice',
    username: 'alice',
    bio: 'Alice bio',
    email: 'alice@example.com',
    avatarUrl: null,
    xp: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { followers: 5, followings: 3 },
  };

  const user2 = {
    id: 'user_2',
    walletAddress: 'GUSER2WALLET',
    name: 'Bob',
    username: 'bob',
    bio: 'Bob bio',
    email: 'bob@example.com',
    avatarUrl: null,
    xp: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { followers: 1, followings: 2 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  // GET /api/users/[id]
  // ────────────────────────────────────────────────────────────

  describe('GET /api/users/[id]', () => {
    it('should return the user profile', async () => {
      (getCurrentUser as any).mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(user1);

      const request = createMockRequest('http://localhost:3000/api/users/user_1');
      const response = await GET(request, { params: Promise.resolve({ id: 'user_1' }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('user_1');
      expect(data.data.walletAddress).toBe('GUSER1WALLET');
    });

    it('should return 404 for a non-existent user', async () => {
      (getCurrentUser as any).mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/users/ghost');
      const response = await GET(request, { params: Promise.resolve({ id: 'ghost' }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should include isFollowing=true when the authenticated user follows the target', async () => {
      (getCurrentUser as any).mockResolvedValue(user1);
      mockPrisma.user.findUnique.mockResolvedValue(user2);
      mockPrisma.follow.findUnique.mockResolvedValue({
        userId: user1.id,
        followingId: user2.id,
      });

      const request = createMockRequest('http://localhost:3000/api/users/user_2');
      const response = await GET(request, { params: Promise.resolve({ id: 'user_2' }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.isFollowing).toBe(true);
    });

    it('should include isFollowing=false when the authenticated user does not follow the target', async () => {
      (getCurrentUser as any).mockResolvedValue(user1);
      mockPrisma.user.findUnique.mockResolvedValue(user2);
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/users/user_2');
      const response = await GET(request, { params: Promise.resolve({ id: 'user_2' }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.isFollowing).toBe(false);
    });

    it('should include isFollowing=false when request is unauthenticated', async () => {
      (getCurrentUser as any).mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(user1);

      const request = createMockRequest('http://localhost:3000/api/users/user_1');
      const response = await GET(request, { params: Promise.resolve({ id: 'user_1' }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.isFollowing).toBe(false);
      // No follow lookup should be performed for anonymous visitors
      expect(mockPrisma.follow.findUnique).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────
  // PATCH /api/users/[id]
  // ────────────────────────────────────────────────────────────

  describe('PATCH /api/users/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      (getCurrentUser as any).mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/users/user_1', {
        method: 'PATCH',
        body: { name: 'New Name' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: 'user_1' }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when attempting to update another user's profile', async () => {
      // user1 is authenticated but targets user2's profile
      (getCurrentUser as any).mockResolvedValue(user1);

      const request = createMockRequest('http://localhost:3000/api/users/user_2', {
        method: 'PATCH',
        body: { name: 'Hacked' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: 'user_2' }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Can only update own profile');
    });

    it('should update own profile successfully', async () => {
      (getCurrentUser as any).mockResolvedValue(user1);
      mockPrisma.user.findFirst.mockResolvedValue(null); // no conflicts
      mockPrisma.user.update.mockResolvedValue({ ...user1, name: 'Alice Updated' });

      const request = createMockRequest('http://localhost:3000/api/users/user_1', {
        method: 'PATCH',
        body: { name: 'Alice Updated' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: 'user_1' }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Alice Updated');
    });

    it('should update bio and email independently', async () => {
      (getCurrentUser as any).mockResolvedValue(user1);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({
        ...user1,
        bio: 'Updated bio',
        email: 'newalice@example.com',
      });

      const request = createMockRequest('http://localhost:3000/api/users/user_1', {
        method: 'PATCH',
        body: { bio: 'Updated bio', email: 'newalice@example.com' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: 'user_1' }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.bio).toBe('Updated bio');
      expect(data.data.email).toBe('newalice@example.com');
    });

    it('should return 409 when the requested username is already taken', async () => {
      (getCurrentUser as any).mockResolvedValue(user1);
      // findFirst returns a conflicting record
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user_3' });

      const request = createMockRequest('http://localhost:3000/api/users/user_1', {
        method: 'PATCH',
        body: { username: 'taken_username' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: 'user_1' }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username is already taken');
    });

    it('should return 409 when the requested email is already in use', async () => {
      (getCurrentUser as any).mockResolvedValue(user1);
      // First findFirst (username check) → no conflict
      // Second findFirst (email check) → conflict
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'user_3' });

      const request = createMockRequest('http://localhost:3000/api/users/user_1', {
        method: 'PATCH',
        body: { username: 'alicenew', email: 'taken@example.com' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: 'user_1' }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email address is already in use');
    });
  });
});

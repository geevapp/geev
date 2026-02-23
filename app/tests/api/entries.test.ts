import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createTestUser, createTestPost, createTestEntry } from '../helpers/db';
import { createMockRequest, parseResponse } from '../helpers/api';
import { POST as CreateEntry, GET as GetEntries } from '@/app/api/posts/[id]/entries/route';
import { DELETE as DeleteEntry } from '@/app/api/entries/[id]/route';

describe('Entry API Endpoints', () => {
  let user1: any, user2: any, user3: any, post: any, requestPost: any;

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    if (process.env.MOCK_DB === 'true') {
      // Mock test data
      user1 = {
        id: 'user_1',
        walletAddress: 'GUSER1WALLET',
        name: 'User One',
        bio: 'Test bio',
        xp: 0,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      user2 = {
        id: 'user_2',
        walletAddress: 'GUSER2WALLET',
        name: 'User Two',
        bio: 'Test bio',
        xp: 0,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      user3 = {
        id: 'user_3',
        walletAddress: 'GUSER3WALLET',
        name: 'User Three',
        bio: 'Test bio',
        xp: 0,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      post = {
        id: 'post_1',
        creatorId: user1.id,
        type: 'giveaway',
        slug: 'test-giveaway',
        title: 'Test Giveaway',
        description: 'Test description for giveaway post',
        category: 'electronics',
        status: 'open',
        selectionMethod: 'random',
        winnerCount: 1,
        media: null,
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      requestPost = {
        id: 'post_2',
        creatorId: user1.id,
        type: 'request',
        slug: 'request-post',
        title: 'Request Post',
        description: 'Test description for request post',
        category: 'services',
        status: 'open',
        selectionMethod: 'random',
        winnerCount: 1,
        media: null,
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      // Create test data with unique identifiers to avoid conflicts with parallel tests
      // Use timestamp + random string for maximum uniqueness
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;

      user1 = await createTestUser({
        name: 'User One',
        walletAddress: `GUSER1_${uniqueId}`,
      });

      user2 = await createTestUser({
        name: 'User Two',
        walletAddress: `GUSER2_${uniqueId}`,
      });

      user3 = await createTestUser({
        name: 'User Three',
        walletAddress: `GUSER3_${uniqueId}`,
      });

      post = await createTestPost(user1.id, {
        title: 'Test Giveaway',
        slug: `test-giveaway-${uniqueId}`,
        status: 'open',
      });

      requestPost = await createTestPost(user1.id, {
        type: 'request',
        title: 'Request Post',
        slug: `request-post-${uniqueId}`,
      });
    }
  });

  describe('POST /api/posts/[id]/entries', () => {
    it('should create an entry successfully', async () => {
      const mockEntry = {
        id: 'entry_1',
        postId: post.id,
        userId: user2.id,
        content: 'This is my entry for the giveaway!',
        proofUrl: 'https://example.com/proof.jpg',
        isWinner: false,
        createdAt: new Date(),
        user: {
          id: user2.id,
          name: user2.name,
          walletAddress: user2.walletAddress,
          avatarUrl: user2.avatarUrl,
        },
      };

      prisma.post.findUnique = vi.fn().mockResolvedValue(post);
      prisma.entry.findUnique = vi.fn().mockResolvedValue(null);
      prisma.entry.create = vi.fn().mockResolvedValue(mockEntry);

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/posts/${post.id}/entries`, {
        method: 'POST',
        body: {
          content: 'This is my entry for the giveaway!',
          proofUrl: 'https://example.com/proof.jpg',
        },
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await CreateEntry(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.content).toBe('This is my entry for the giveaway!');
      expect(data.data.proofUrl).toBe('https://example.com/proof.jpg');
      expect(data.data.userId).toBe(user2.id);
      expect(data.data.postId).toBe(post.id);
      expect(data.message).toBe('Entry created successfully');
    });

    it('should create an entry without proofUrl', async () => {
      const mockEntry = {
        id: 'entry_2',
        postId: post.id,
        userId: user2.id,
        content: 'Entry without proof URL',
        proofUrl: null,
        isWinner: false,
        createdAt: new Date(),
        user: {
          id: user2.id,
          name: user2.name,
          walletAddress: user2.walletAddress,
          avatarUrl: user2.avatarUrl,
        },
      };

      prisma.post.findUnique = vi.fn().mockResolvedValue(post);
      prisma.entry.findUnique = vi.fn().mockResolvedValue(null);
      prisma.entry.create = vi.fn().mockResolvedValue(mockEntry);

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/posts/${post.id}/entries`, {
        method: 'POST',
        body: {
          content: 'Entry without proof URL',
        },
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await CreateEntry(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.proofUrl).toBeNull();
    });

    it('should reject unauthenticated requests', async () => {
      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(null);

      const request = createMockRequest(`http://localhost:3000/api/posts/${post.id}/entries`, {
        method: 'POST',
        body: {
          content: 'This should fail',
        },
      });

      const response = await CreateEntry(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject content that is too short', async () => {
      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/posts/${post.id}/entries`, {
        method: 'POST',
        body: {
          content: 'Short',
        },
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await CreateEntry(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Content must be between 10 and 5000 characters');
    });

    it('should reject content that is too long', async () => {
      const longContent = 'a'.repeat(5001);
      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/posts/${post.id}/entries`, {
        method: 'POST',
        body: {
          content: longContent,
        },
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await CreateEntry(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Content must be between 10 and 5000 characters');
    });

    it('should reject missing content', async () => {
      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/posts/${post.id}/entries`, {
        method: 'POST',
        body: {},
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await CreateEntry(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Content is required');
    });

    it('should reject duplicate entries from the same user', async () => {
      const existingEntry = {
        id: 'entry_existing',
        postId: post.id,
        userId: user2.id,
        content: 'Existing entry',
        proofUrl: null,
        isWinner: false,
        createdAt: new Date(),
      };

      prisma.post.findUnique = vi.fn().mockResolvedValue(post);
      prisma.entry.findUnique = vi.fn().mockResolvedValue(existingEntry);

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/posts/${post.id}/entries`, {
        method: 'POST',
        body: {
          content: 'Attempting to enter again',
        },
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await CreateEntry(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('You have already entered this giveaway');
    });

    it('should reject entries to non-existent posts', async () => {
      prisma.post.findUnique = vi.fn().mockResolvedValue(null);

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/posts/non-existent-id/entries`, {
        method: 'POST',
        body: {
          content: 'Entry to non-existent post',
        },
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await CreateEntry(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Post not found');
    });

    it('should reject entries to closed posts', async () => {
      const closedPost = { ...post, status: 'closed' };

      prisma.post.findUnique = vi.fn().mockResolvedValue(closedPost);

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/posts/${post.id}/entries`, {
        method: 'POST',
        body: {
          content: 'Entry to closed post',
        },
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await CreateEntry(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Post is not accepting entries');
    });

    it('should reject creator from entering their own post', async () => {
      prisma.post.findUnique = vi.fn().mockResolvedValue(post);
      prisma.entry.findUnique = vi.fn().mockResolvedValue(null);

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user1);

      const request = createMockRequest(`http://localhost:3000/api/posts/${post.id}/entries`, {
        method: 'POST',
        body: {
          content: 'Creator trying to enter own post',
        },
        headers: { 'x-mock-wallet': user1.walletAddress },
      });

      const response = await CreateEntry(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('You cannot enter your own giveaway');
    });

    it('should reject entries to non-giveaway posts', async () => {
      prisma.post.findUnique = vi.fn().mockResolvedValue(requestPost);

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/posts/${requestPost.id}/entries`, {
        method: 'POST',
        body: {
          content: 'Entry to request post',
        },
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await CreateEntry(request, {
        params: Promise.resolve({ id: requestPost.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Entries can only be submitted to giveaway posts');
    });
  });

  describe('GET /api/posts/[id]/entries', () => {
    it('should get entries for a post with default pagination', async () => {
      const mockEntries = [
        {
          id: 'entry_1',
          postId: post.id,
          userId: user2.id,
          content: 'First entry',
          proofUrl: null,
          isWinner: false,
          createdAt: new Date(),
          user: {
            id: user2.id,
            name: user2.name,
            walletAddress: user2.walletAddress,
            avatarUrl: user2.avatarUrl,
          },
        },
        {
          id: 'entry_2',
          postId: post.id,
          userId: user3.id,
          content: 'Second entry',
          proofUrl: null,
          isWinner: false,
          createdAt: new Date(),
          user: {
            id: user3.id,
            name: user3.name,
            walletAddress: user3.walletAddress,
            avatarUrl: user3.avatarUrl,
          },
        },
      ];

      prisma.post.findUnique = vi.fn().mockResolvedValue(post);
      prisma.entry.findMany = vi.fn().mockResolvedValue(mockEntries);
      prisma.entry.count = vi.fn().mockResolvedValue(2);

      const request = createMockRequest(`http://localhost:3000/api/posts/${post.id}/entries`);

      const response = await GetEntries(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.entries).toHaveLength(2);
      expect(data.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(data.data.entries[0].user).toBeDefined();
      expect(data.data.entries[0].user.name).toBeDefined();
    });

    it('should support custom pagination', async () => {
      const mockEntries = [
        { id: 'entry_3', postId: post.id, userId: 'user_3', content: 'Entry 3', proofUrl: null, isWinner: false, createdAt: new Date(), user: user3 },
        { id: 'entry_4', postId: post.id, userId: 'user_4', content: 'Entry 4', proofUrl: null, isWinner: false, createdAt: new Date(), user: user3 },
      ];

      prisma.post.findUnique = vi.fn().mockResolvedValue(post);
      prisma.entry.findMany = vi.fn().mockResolvedValue(mockEntries);
      prisma.entry.count = vi.fn().mockResolvedValue(5);

      const request = createMockRequest(
        `http://localhost:3000/api/posts/${post.id}/entries?page=2&limit=2`,
      );

      const response = await GetEntries(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.entries).toHaveLength(2);
      expect(data.data.pagination).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });

    it('should reject invalid pagination parameters', async () => {
      const request = createMockRequest(
        `http://localhost:3000/api/posts/${post.id}/entries?page=0&limit=-1`,
      );

      const response = await GetEntries(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid pagination parameters');
    });

    it('should reject limit greater than 100', async () => {
      const request = createMockRequest(
        `http://localhost:3000/api/posts/${post.id}/entries?limit=101`,
      );

      const response = await GetEntries(request, {
        params: Promise.resolve({ id: post.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid pagination parameters');
    });

    it('should return 404 for non-existent post', async () => {
      prisma.post.findUnique = vi.fn().mockResolvedValue(null);

      const request = createMockRequest(
        `http://localhost:3000/api/posts/non-existent-id/entries`,
      );

      const response = await GetEntries(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Post not found');
    });
  });

  describe('DELETE /api/entries/[id]', () => {
    it('should delete own entry successfully', async () => {
      const entryId = 'entry_to_delete';
      const mockEntry = {
        id: entryId,
        postId: post.id,
        userId: user2.id,
        content: 'Entry to delete',
        proofUrl: null,
        isWinner: false,
        createdAt: new Date(),
        post: { status: 'open' },
      };

      prisma.entry.findUnique = vi.fn().mockResolvedValue(mockEntry);
      prisma.entry.delete = vi.fn().mockResolvedValue(mockEntry);

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/entries/${entryId}`, {
        method: 'DELETE',
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await DeleteEntry(request, {
        params: Promise.resolve({ id: entryId }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(entryId);
      expect(data.message).toBe('Entry deleted successfully');
    });

    it('should reject unauthenticated delete requests', async () => {
      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(null);

      const request = createMockRequest(`http://localhost:3000/api/entries/entry_1`, {
        method: 'DELETE',
      });

      const response = await DeleteEntry(request, {
        params: Promise.resolve({ id: 'entry_1' }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject deleting non-existent entry', async () => {
      prisma.entry.findUnique = vi.fn().mockResolvedValue(null);

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/entries/non-existent-id`, {
        method: 'DELETE',
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await DeleteEntry(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Entry not found');
    });

    it('should reject deleting another user\'s entry', async () => {
      const entryId = 'entry_other_user';
      const mockEntry = {
        id: entryId,
        postId: post.id,
        userId: user2.id,
        content: 'Other user entry',
        proofUrl: null,
        isWinner: false,
        createdAt: new Date(),
        post: { status: 'open' },
      };

      prisma.entry.findUnique = vi.fn().mockResolvedValue(mockEntry);

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user1);

      const request = createMockRequest(`http://localhost:3000/api/entries/${entryId}`, {
        method: 'DELETE',
        headers: { 'x-mock-wallet': user1.walletAddress },
      });

      const response = await DeleteEntry(request, {
        params: Promise.resolve({ id: entryId }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('You can only delete your own entries');
    });

    it('should reject deleting entry from closed post', async () => {
      const entryId = 'entry_closed_post';
      const mockEntry = {
        id: entryId,
        postId: post.id,
        userId: user2.id,
        content: 'Entry in closed post',
        proofUrl: null,
        isWinner: false,
        createdAt: new Date(),
        post: { status: 'closed' },
      };

      prisma.entry.findUnique = vi.fn().mockResolvedValue(mockEntry);

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(user2);

      const request = createMockRequest(`http://localhost:3000/api/entries/${entryId}`, {
        method: 'DELETE',
        headers: { 'x-mock-wallet': user2.walletAddress },
      });

      const response = await DeleteEntry(request, {
        params: Promise.resolve({ id: entryId }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'Cannot delete entry from a closed or completed post',
      );
    });
  });
});

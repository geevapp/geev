import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST, GET } from '@/app/api/posts/[id]/entries/route';
import { DELETE } from '@/app/api/entries/[id]/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { createTestUser, createTestPost } from '../helpers/db';
import { prisma } from '@/lib/prisma';

describe('Entries API', () => {
  let testUser: any;
  let anotherUser: any;
  let testPost: any;

  beforeEach(async () => {
    // Mock user and post creation for unit tests where DB is not available
    if (process.env.MOCK_DB === 'true') {
      testUser = {
        id: 'user_123',
        walletAddress: '0x123',
        name: 'Test User',
        bio: 'Test bio',
        xp: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      anotherUser = {
        id: 'user_456',
        walletAddress: '0x456',
        name: 'Another User',
        bio: 'Another bio',
        xp: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      testPost = {
        id: 'post_123',
        creatorId: 'user_999',
        type: 'giveaway',
        title: 'Test Giveaway',
        description: 'This is a test giveaway post with a long enough description.',
        category: 'electronics',
        status: 'open',
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma methods
      prisma.post.findUnique = vi.fn().mockResolvedValue(testPost);
      prisma.entry.findFirst = vi.fn().mockResolvedValue(null);
      prisma.entry.create = vi.fn().mockImplementation((args: any) =>
        Promise.resolve({
          id: 'entry_123',
          ...args.data,
          createdAt: new Date(),
          user: testUser,
        })
      );
      prisma.entry.findMany = vi.fn().mockResolvedValue([]);
      prisma.entry.count = vi.fn().mockResolvedValue(0);
      prisma.entry.findUnique = vi.fn().mockResolvedValue(null);
      prisma.entry.delete = vi.fn().mockResolvedValue({});
    } else {
      testUser = await createTestUser({
        name: 'Test User',
        walletAddress: 'GTEST123',
      });

      anotherUser = await createTestUser({
        name: 'Another User',
        walletAddress: 'GANOTHER456',
      });

      const postCreator = await createTestUser({
        name: 'Post Creator',
        walletAddress: 'GCREATOR789',
      });

      testPost = await createTestPost(postCreator.id, {
        title: 'Test Giveaway',
        description: 'This is a test giveaway post with a long enough description.',
        category: 'electronics',
        status: 'open',
      });
    }
  });

  describe('POST /api/posts/[id]/entries', () => {
    it('should create a new entry successfully', async () => {
      const entryData = {
        content: 'This is my entry to the giveaway! I would love to win this.',
        proofUrl: 'https://example.com/proof.jpg',
      };

      const request = createMockRequest(
        `http://localhost:3000/api/posts/${testPost.id}/entries`,
        {
          method: 'POST',
          body: entryData,
          cookies: { session: 'mock-session-token' },
        }
      );

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(
        testUser
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.content).toBe(entryData.content);
    });

    it('should reject entry without authentication', async () => {
      const entryData = {
        content: 'This is my entry to the giveaway!',
      };

      const request = createMockRequest(
        `http://localhost:3000/api/posts/${testPost.id}/entries`,
        {
          method: 'POST',
          body: entryData,
        }
      );

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(
        null
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should reject entry with content less than 10 characters', async () => {
      const entryData = {
        content: 'Short',
      };

      const request = createMockRequest(
        `http://localhost:3000/api/posts/${testPost.id}/entries`,
        {
          method: 'POST',
          body: entryData,
        }
      );

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(
        testUser
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toContain('at least 10 characters');
    });

    it('should reject entry for non-existent post', async () => {
      const entryData = {
        content: 'This is my entry to the giveaway!',
      };

      if (process.env.MOCK_DB === 'true') {
        prisma.post.findUnique = vi.fn().mockResolvedValue(null);
      }

      const request = createMockRequest(
        'http://localhost:3000/api/posts/non-existent-id/entries',
        {
          method: 'POST',
          body: entryData,
        }
      );

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(
        testUser
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toContain('Post not found');
    });

    it('should reject entry for closed post', async () => {
      const closedPost = { ...testPost, status: 'closed' };

      if (process.env.MOCK_DB === 'true') {
        prisma.post.findUnique = vi.fn().mockResolvedValue(closedPost);
      } else {
        await prisma.post.update({
          where: { id: testPost.id },
          data: { status: 'closed' },
        });
      }

      const entryData = {
        content: 'This is my entry to the giveaway!',
      };

      const request = createMockRequest(
        `http://localhost:3000/api/posts/${testPost.id}/entries`,
        {
          method: 'POST',
          body: entryData,
        }
      );

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(
        testUser
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toContain('closed');
    });

    it('should reject duplicate entry from same user', async () => {
      const existingEntry = {
        id: 'entry_existing',
        postId: testPost.id,
        userId: testUser.id,
        content: 'Existing entry',
        createdAt: new Date(),
      };

      if (process.env.MOCK_DB === 'true') {
        prisma.entry.findFirst = vi.fn().mockResolvedValue(existingEntry);
      } else {
        await prisma.entry.create({
          data: {
            postId: testPost.id,
            userId: testUser.id,
            content: 'This is my first entry to the giveaway!',
          },
        });
      }

      const entryData = {
        content: 'This is my second entry attempt!',
      };

      const request = createMockRequest(
        `http://localhost:3000/api/posts/${testPost.id}/entries`,
        {
          method: 'POST',
          body: entryData,
        }
      );

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(
        testUser
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toContain('already entered');
    });

    it('should reject creator entering their own post', async () => {
      const creatorUser = {
        id: testPost.creatorId,
        walletAddress: '0x999',
        name: 'Post Creator',
      };

      const entryData = {
        content: 'This is my entry to my own giveaway!',
      };

      const request = createMockRequest(
        `http://localhost:3000/api/posts/${testPost.id}/entries`,
        {
          method: 'POST',
          body: entryData,
        }
      );

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(
        creatorUser
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toContain('cannot enter your own post');
    });
  });

  describe('GET /api/posts/[id]/entries', () => {
    it('should return empty array when no entries exist', async () => {
      const request = createMockRequest(
        `http://localhost:3000/api/posts/${testPost.id}/entries`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.entries).toEqual([]);
    });

    it('should return entries for a post with pagination', async () => {
      const mockEntries = [
        {
          id: 'entry_1',
          postId: testPost.id,
          userId: testUser.id,
          content: 'Entry 1',
          createdAt: new Date(),
          user: testUser,
        },
      ];

      if (process.env.MOCK_DB === 'true') {
        prisma.entry.findMany = vi.fn().mockResolvedValue(mockEntries);
        prisma.entry.count = vi.fn().mockResolvedValue(1);
      } else {
        await prisma.entry.create({
          data: {
            postId: testPost.id,
            userId: testUser.id,
            content: 'This is my entry to the giveaway!',
          },
        });
      }

      const request = createMockRequest(
        `http://localhost:3000/api/posts/${testPost.id}/entries?page=1&limit=10`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.entries).toHaveLength(1);
      expect(data.data.page).toBe(1);
      expect(data.data.limit).toBe(10);
    });

    it('should return 404 for non-existent post', async () => {
      if (process.env.MOCK_DB === 'true') {
        prisma.post.findUnique = vi.fn().mockResolvedValue(null);
      }

      const request = createMockRequest(
        'http://localhost:3000/api/posts/non-existent-id/entries'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toContain('Post not found');
    });
  });

  describe('DELETE /api/entries/[id]', () => {
    it('should delete own entry successfully', async () => {
      const entry = {
        id: 'entry_123',
        postId: testPost.id,
        userId: testUser.id,
        content: 'My entry',
        post: {
          status: 'open',
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      if (process.env.MOCK_DB === 'true') {
        prisma.entry.findUnique = vi.fn().mockResolvedValue(entry);
        prisma.entry.delete = vi.fn().mockResolvedValue(entry);
      } else {
        const createdEntry = await prisma.entry.create({
          data: {
            postId: testPost.id,
            userId: testUser.id,
            content: 'This is my entry to the giveaway!',
          },
        });
        entry.id = createdEntry.id;
      }

      const request = createMockRequest(
        `http://localhost:3000/api/entries/${entry.id}`,
        {
          method: 'DELETE',
        }
      );

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(
        testUser
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: entry.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject deletion without authentication', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/entries/entry_123',
        {
          method: 'DELETE',
        }
      );

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(
        null
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'entry_123' }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should reject deletion of non-existent entry', async () => {
      if (process.env.MOCK_DB === 'true') {
        prisma.entry.findUnique = vi.fn().mockResolvedValue(null);
      }

      const request = createMockRequest(
        'http://localhost:3000/api/entries/non-existent-id',
        {
          method: 'DELETE',
        }
      );

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(
        testUser
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toContain('Entry not found');
    });

    it('should reject deletion of another user\'s entry', async () => {
      const entry = {
        id: 'entry_123',
        postId: testPost.id,
        userId: anotherUser.id,
        content: 'Another user entry',
        post: {
          status: 'open',
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      if (process.env.MOCK_DB === 'true') {
        prisma.entry.findUnique = vi.fn().mockResolvedValue(entry);
      } else {
        const createdEntry = await prisma.entry.create({
          data: {
            postId: testPost.id,
            userId: anotherUser.id,
            content: 'This is another user\'s entry!',
          },
        });
        entry.id = createdEntry.id;
      }

      const request = createMockRequest(
        `http://localhost:3000/api/entries/${entry.id}`,
        {
          method: 'DELETE',
        }
      );

      vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(
        testUser
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: entry.id }),
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error).toContain('only delete your own');
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/posts/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { createTestUser } from '../helpers/db';
import { prisma } from '@/lib/prisma';

describe('Posts API', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  describe('GET /api/posts', () => {
    it('should return empty array when no posts exist', async () => {
      const request = createMockRequest('http://localhost:3000/api/posts');
      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.posts).toEqual([]);
    });

    it('should return posts with pagination', async () => {
      await prisma.post.create({
        data: {
          creatorId: testUser.id,
          type: 'giveaway',
          title: 'Test Post',
          description:
            'A test post description that is long enough to meet requirements.',
          category: 'electronics',
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const request = createMockRequest(
        'http://localhost:3000/api/posts?page=1&limit=10',
      );
      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.posts).toHaveLength(1);
      expect(data.data.page).toBe(1);
      expect(data.data.limit).toBe(10);
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const postData = {
        title: 'New Test Post',
        description:
          'This is a test post description with enough characters to pass validation rules.',
        category: 'electronics',
        type: 'giveaway',
        winnerCount: 1,
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const request = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: postData,
        cookies: { session: 'mock-session-token' },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.data.title).toBe(postData.title);
    });

    it('should validate title length', async () => {
      const postData = {
        title: 'Short',
        description: 'This is a test post description with enough characters.',
        category: 'electronics',
        type: 'giveaway',
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const request = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: postData,
      });

      const response = await POST(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(400);
    });
  });
});

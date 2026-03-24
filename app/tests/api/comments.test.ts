import { GET, POST } from '@/app/api/posts/[id]/comments/route';
import { DELETE } from '@/app/api/comments/[commentId]/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, parseResponse } from '../helpers/api';
import { createTestUser, createTestPost } from '../helpers/db';
import { prisma } from '@/lib/prisma';

describe('Comments API', () => {
  let testUser: any;
  let testPost: any;

  beforeEach(async () => {
    vi.clearAllMocks();

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

      testPost = { id: 'post_123' };

      prisma.user.findUnique = vi.fn().mockResolvedValue(testUser);
      prisma.post.findUnique = vi.fn().mockResolvedValue(testPost);
      prisma.comment.count = vi.fn().mockResolvedValue(0);
      prisma.comment.findMany = vi.fn().mockResolvedValue([]);
      prisma.comment.create = vi.fn().mockImplementation((args: any) => Promise.resolve({
        id: 'comment_123',
        ...args.data,
        createdAt: new Date().toISOString(),
        user: testUser,
      }));
      prisma.comment.findUnique = vi.fn().mockResolvedValue({
        id: 'comment_123',
        userId: testUser.id,
        postId: testPost.id,
      });
      prisma.comment.delete = vi.fn().mockResolvedValue(true);
    } else {
      testUser = await createTestUser();
      testPost = await createTestPost(testUser.id);
    }
  });

  it('GET should return an empty comments array', async () => {
    prisma.comment.findMany = vi.fn().mockResolvedValue([]);
    prisma.comment.count = vi.fn().mockResolvedValue(0);

    const request = createMockRequest(`http://localhost:3000/api/posts/${testPost.id}/comments`);
    const response = await GET(request, { params: { id: testPost.id } } as any);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.data.comments).toEqual([]);
  });

  it('POST should create a new comment', async () => {
    vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(testUser);

    const body = { content: 'Nice post!' };
    const request = createMockRequest(`http://localhost:3000/api/posts/${testPost.id}/comments`, {
      method: 'POST',
      body,
    });

    const response = await POST(request, { params: { id: testPost.id } } as any);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.content).toBe('Nice post!');
  });

  it('POST should validate content', async () => {
    vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(testUser);

    const request = createMockRequest(`http://localhost:3000/api/posts/${testPost.id}/comments`, {
      method: 'POST',
      body: { content: '' },
    });

    const response = await POST(request, { params: { id: testPost.id } } as any);
    const { status } = await parseResponse(response);

    expect(status).toBe(400);
  });

  it('DELETE should remove comment for owner', async () => {
    vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue(testUser);

    const request = createMockRequest(`http://localhost:3000/api/comments/comment_123`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { commentId: 'comment_123' } } as any);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('DELETE should return 403 if user is not owner', async () => {
    vi.spyOn(await import('@/lib/auth'), 'getCurrentUser').mockResolvedValue({ ...testUser, id: 'other' });
    prisma.comment.findUnique = vi.fn().mockResolvedValue({ id: 'comment_123', userId: testUser.id, postId: testPost.id });

    const request = createMockRequest(`http://localhost:3000/api/comments/comment_123`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { commentId: 'comment_123' } } as any);
    const { status } = await parseResponse(response);

    expect(status).toBe(403);
  });
});

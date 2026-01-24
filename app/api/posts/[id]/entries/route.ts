/**
 * API route for entry submission and retrieval for a specific post
 * Handles POST (submit entry) and GET (list entries) operations
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import type { Entry } from '@/lib/types';

// Mock data for entries since we don't have a real database yet
const mockEntries: any[] = [
  {
    id: 'entry-1',
    postId: 'post-1',
    userId: 'user-1',
    content: 'I would love to win this amazing giveaway! I\'ve been following the community for months and always wanted to contribute more.',
    proofUrl: 'https://example.com/proof.jpg',
    isWinner: false,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    user: {
      id: 'user-1',
      name: 'Alex Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      username: 'alexchen',
    },
  },
  {
    id: 'entry-2',
    postId: 'post-1',
    userId: 'user-2',
    content: 'This looks incredible! Count me in for this awesome opportunity.',
    proofUrl: null,
    isWinner: false,
    createdAt: new Date('2024-01-15T11:45:00Z'),
    user: {
      id: 'user-2',
      name: 'Sarah Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      username: 'sarahj',
    },
  },
];

// Mock posts data
const mockPosts: any[] = [
  {
    id: 'post-1',
    title: 'Amazing Crypto Giveaway!',
    description: 'Win 1000 XLM tokens by participating in our community event',
    status: 'open',
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  {
    id: 'post-2',
    title: 'Help Request: Laptop Needed',
    description: 'Need a laptop for online classes. Any help would be appreciated!',
    status: 'open',
    endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  },
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const { id: postId } = await params;
    const body = await request.json();
    const { content, proofUrl } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return apiError('Content is required', 400);
    }

    if (content.length < 10) {
      return apiError('Entry must be at least 10 characters', 400);
    }

    if (content.length > 1000) {
      return apiError('Entry must be less than 1000 characters', 400);
    }

    // Check post exists and is open
    const post = mockPosts.find(p => p.id === postId);
    
    if (!post) {
      return apiError('Post not found', 404);
    }

    if (post.status !== 'open' || new Date(post.endsAt) < new Date()) {
      return apiError('Post is closed', 400);
    }

    // Check for duplicate entry
    const existingEntry = mockEntries.find(
      e => e.postId === postId && e.userId === user.id
    );

    if (existingEntry) {
      return apiError('You have already entered this post', 400);
    }

    // Create entry (mock implementation)
    const newEntry = {
      id: `entry-${Date.now()}`,
      postId,
      userId: user.id,
      content,
      proofUrl: proofUrl || null,
      isWinner: false,
      createdAt: new Date(),
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        username: user.username,
      },
    };

    // In a real implementation with Prisma:
    /*
    const entry = await prisma.entry.create({
      data: {
        postId,
        userId: user.id,
        content,
        proofUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            username: true,
          },
        },
      },
    });
    */

    // Add to mock entries
    mockEntries.push(newEntry);

    return apiSuccess(newEntry, 'Entry submitted successfully', 201);
  } catch (error) {
    console.error('Entry submission error:', error);
    return apiError('Failed to create entry', 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    // Check if post exists
    const post = mockPosts.find(p => p.id === postId);
    
    if (!post) {
      return apiError('Post not found', 404);
    }

    // Get entries for this post
    const entries = mockEntries
      .filter(e => e.postId === postId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // In a real implementation with Prisma:
    /*
    const entries = await prisma.entry.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    */

    return apiSuccess(entries);
  } catch (error) {
    console.error('Fetch entries error:', error);
    return apiError('Failed to fetch entries', 500);
  }
}

import { apiError, apiSuccess } from '@/lib/api-response';

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndAwardBadges } from '@/lib/badges';

/**
 * POST /api/entries
 * Submit a new entry for a giveaway post
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid or missing JSON body', 400);
    }

    const { postId, content, proofUrl, proofImage } = body;

    // Validate required fields
    if (!postId) {
      return apiError('Post ID is required', 400);
    }

    if (!content || content.length < 10) {
      return apiError('Entry content must be at least 10 characters', 400);
    }

    // Verify the post exists and is open
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        status: true,
        type: true,
        endsAt: true,
      },
    });

    if (!post) {
      return apiError('Post not found', 404);
    }

    if (post.status !== 'open') {
      return apiError('Cannot submit entry - post is not open', 400);
    }

    if (new Date(post.endsAt) < new Date()) {
      return apiError('Cannot submit entry - post has ended', 400);
    }

    // Check if user already submitted an entry
    const existingEntry = await prisma.entry.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    if (existingEntry) {
      return apiError('You have already submitted an entry for this post', 409);
    }

    // Create the entry
    const entry = await prisma.entry.create({
      data: {
        postId,
        userId: user.id,
        content,
        proofUrl: proofUrl || null,
        proofImage: proofImage || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Award badges for submitting first entry to a giveaway
    if (post.type === 'giveaway') {
      await checkAndAwardBadges(user.id);
    }

    return apiSuccess(entry, 'Entry submitted successfully', 201);
  } catch (error) {
    console.error('Error submitting entry:', error);
    return apiError('Failed to submit entry', 500);
  }
}

/**
 * GET /api/entries
 * Get entries for a specific post (with pagination)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!postId) {
      return apiError('Post ID is required', 400);
    }

    const where: any = { postId };

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              rank: true,
            },
          },
        },
      }),
      prisma.entry.count({ where }),
    ]);

    return apiSuccess({
      entries,
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return apiError('Failed to fetch entries', 500);
  }
}

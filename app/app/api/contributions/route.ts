import { apiError, apiSuccess } from '@/lib/api-response';

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndAwardBadges } from '@/lib/badges';

/**
 * POST /api/contributions
 * Submit a new contribution to a help request post
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

    const { postId, amount, message, currency, isAnonymous } = body;

    // Validate required fields
    if (!postId) {
      return apiError('Post ID is required', 400);
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return apiError('Valid contribution amount is required', 400);
    }

    // Verify the post exists and is a request type
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        status: true,
        type: true,
        helpType: true,
      },
    });

    if (!post) {
      return apiError('Post not found', 404);
    }

    if (post.type !== 'request') {
      return apiError('Can only contribute to help request posts', 400);
    }

    if (post.status !== 'open' && post.status !== 'active') {
      return apiError('Cannot contribute - post is not accepting contributions', 400);
    }

    // Create the contribution
    const contribution = await prisma.helpContribution.create({
      data: {
        postId,
        userId: user.id,
        amount: Number(amount),
        message: message || null,
        currency: currency || null,
        isAnonymous: isAnonymous || false,
        contributedAt: new Date(),
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

    // Award badges for contributing to help requests
    await checkAndAwardBadges(user.id);

    return apiSuccess(contribution, 'Contribution submitted successfully', 201);
  } catch (error) {
    console.error('Error submitting contribution:', error);
    return apiError('Failed to submit contribution', 500);
  }
}

/**
 * GET /api/contributions
 * Get contributions for a specific post (with pagination)
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

    const [contributions, total] = await Promise.all([
      prisma.helpContribution.findMany({
        where,
        orderBy: { contributedAt: 'desc' },
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
      prisma.helpContribution.count({ where }),
    ]);

    return apiSuccess({
      contributions,
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return apiError('Failed to fetch contributions', 500);
  }
}

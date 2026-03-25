import { apiError, apiSuccess } from '@/lib/api-response';

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndAwardBadges, awardBadge } from '@/lib/badges';

/**
 * POST /api/winners
 * Assign a winner to a giveaway post
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

    const { postId, winnerId } = body;

    // Validate required fields
    if (!postId || !winnerId) {
      return apiError('Post ID and winner ID are required', 400);
    }

    // Verify the post exists and is a giveaway
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        type: true,
        status: true,
        maxWinners: true,
      },
    });

    if (!post) {
      return apiError('Post not found', 404);
    }

    if (post.type !== 'giveaway') {
      return apiError('Can only assign winners for giveaway posts', 400);
    }

    if (post.status === 'completed' || post.status === 'cancelled') {
      return apiError('Cannot assign winner - post is completed or cancelled', 400);
    }

    // Verify the winner exists and has submitted an entry
    const entry = await prisma.entry.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: winnerId,
        },
      },
    });

    if (!entry) {
      return apiError('User has not submitted an entry for this post', 404);
    }

    // Check if already a winner
    const existingWinner = await prisma.postWinner.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: winnerId,
        },
      },
    });

    if (existingWinner) {
      return apiError('User is already a winner for this post', 409);
    }

    // Check if we've reached max winners
    if (post.maxWinners) {
      const currentWinnerCount = await prisma.postWinner.count({
        where: { postId },
      });

      if (currentWinnerCount >= post.maxWinners) {
        return apiError('Maximum number of winners already reached', 400);
      }
    }

    // Assign the winner
    await prisma.postWinner.create({
      data: {
        postId,
        userId: winnerId,
        assignedBy: user.id,
      },
    });

    // Update entry to mark as winner
    await prisma.entry.update({
      where: {
        id: entry.id,
      },
      data: {
        isWinner: true,
      },
    });

    // Award "First Win" badge if this is their first win
    await checkAndAwardBadges(winnerId);

    // Optionally award a special badge manually
    await awardBadge(winnerId, 'first-win');

    return apiSuccess(
      { postId, winnerId },
      'Winner assigned successfully',
      201
    );
  } catch (error) {
    console.error('Error assigning winner:', error);
    return apiError('Failed to assign winner', 500);
  }
}

/**
 * GET /api/winners
 * Get all winners for a specific post
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return apiError('Post ID is required', 400);
    }

    const winners = await prisma.postWinner.findMany({
      where: { postId },
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
    });

    return apiSuccess(winners);
  } catch (error) {
    console.error('Error fetching winners:', error);
    return apiError('Failed to fetch winners', 500);
  }
}

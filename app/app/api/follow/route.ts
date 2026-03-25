import { apiError, apiSuccess } from '@/lib/api-response';

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndAwardBadges } from '@/lib/badges';

/**
 * POST /api/follow
 * Follow a user
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

    const { followingId } = body;

    // Validate required fields
    if (!followingId) {
      return apiError('User ID to follow is required', 400);
    }

    // Cannot follow yourself
    if (user.id === followingId) {
      return apiError('Cannot follow yourself', 400);
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        userId_followingId: {
          userId: user.id,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return apiError('Already following this user', 409);
    }

    // Create the follow relationship
    await prisma.follow.create({
      data: {
        userId: user.id,
        followingId,
      },
    });

    // Award "Community Builder" badge if the followed user reached 100 followers
    await checkAndAwardBadges(followingId);

    return apiSuccess(
      { userId: user.id, followingId },
      'Successfully followed user',
      201
    );
  } catch (error) {
    console.error('Error following user:', error);
    return apiError('Failed to follow user', 500);
  }
}

/**
 * DELETE /api/follow
 * Unfollow a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid or missing JSON body', 400);
    }

    const { followingId } = body;

    if (!followingId) {
      return apiError('User ID to unfollow is required', 400);
    }

    // Delete the follow relationship
    await prisma.follow.delete({
      where: {
        userId_followingId: {
          userId: user.id,
          followingId,
        },
      },
    });

    return apiSuccess(
      { userId: user.id, followingId },
      'Successfully unfollowed user',
      200
    );
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return apiError('Failed to unfollow user', 500);
  }
}

/**
 * GET /api/follow
 * Get followers or following list for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'followers' or 'following'

    if (!userId) {
      return apiError('User ID is required', 400);
    }

    if (type === 'followers') {
      // Get users who follow this user
      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
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

      return apiSuccess(followers.map((f: any) => f.user));
    } else if (type === 'following') {
      // Get users this user follows
      const following = await prisma.follow.findMany({
        where: { userId },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              rank: true,
            },
          },
        },
      });

      return apiSuccess(following.map((f: any) => f.following));
    } else {
      return apiError('Invalid type. Must be "followers" or "following"', 400);
    }
  } catch (error) {
    console.error('Error fetching follow list:', error);
    return apiError('Failed to fetch follow list', 500);
  }
}

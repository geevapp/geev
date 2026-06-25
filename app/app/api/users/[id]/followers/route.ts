import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: targetUserId } = await params;
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get('limit'));
    const rawSkip = Number(searchParams.get('skip'));
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(Math.floor(rawLimit), 100);
    const skip = Number.isNaN(rawSkip) || rawSkip < 0 ? 0 : Math.floor(rawSkip);

    // Followers are users who follow the target user
    // i.e., followingId = targetUserId
    // we want to return the `user` relation (the follower)
    const followers = await prisma.follow.findMany({
      where: { followingId: targetUserId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            xp: true,
            walletAddress: true,
            bio: true,
          }
        }
      },
      take: limit,
      skip,
      orderBy: { id: 'desc' }
    });

    const total = await prisma.follow.count({
      where: { followingId: targetUserId }
    });

    return apiSuccess({
      items: followers.map(f => f.user).filter(Boolean),
      total,
      limit,
      skip
    });
  } catch (error) {
    console.error('Failed to fetch followers:', error);
    return apiError('Failed to fetch followers', 500);
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Following are users the target user follows
    // i.e., userId = targetUserId, followingId != null
    // we want to return the `following` relation (the person being followed)
    const following = await prisma.follow.findMany({
      where: { userId: targetUserId, followingId: { not: null } },
      include: {
        following: {
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
      where: { userId: targetUserId, followingId: { not: null } }
    });

    return apiSuccess({
      items: following.map(f => f.following).filter(Boolean),
      total,
      limit,
      skip
    });
  } catch (error) {
    console.error('Failed to fetch following:', error);
    return apiError('Failed to fetch following', 500);
  }
}

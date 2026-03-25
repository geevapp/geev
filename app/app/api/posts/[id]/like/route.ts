import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { awardXp, XP_REWARDS } from '@/lib/xp';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    const { id: postId } = await params;

    const { count } = await prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!post) {
        throw new Error('POST_NOT_FOUND');
      }

      await tx.interaction.upsert({
        where: {
          userId_postId_type: {
            userId: user.id,
            postId,
            type: 'like',
          },
        },
        update: {},
        create: {
          userId: user.id,
          postId,
          type: 'like',
        },
      });

      const likeCount = await tx.interaction.count({
        where: {
          postId,
          type: 'like',
        },
      });

      if (likeCount === 10) {
        await awardXp(
          post.userId,
          XP_REWARDS.receiveTenLikes,
          'post_received_10_likes',
          {
            dedupeKey: `post_10_likes:${postId}`,
            metadata: {
              postId,
              likeCount,
            },
          },
          tx,
        );
      }

      return { count: likeCount };
    });

    return apiSuccess({ liked: true, count });
  } catch (error) {
    if (error instanceof Error && error.message === 'POST_NOT_FOUND') {
      return apiError('Post not found', 404);
    }

    return apiError('Failed to like post', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    const { id: postId } = await params;

    await prisma.interaction.deleteMany({
      where: {
        userId: user.id,
        postId,
        type: 'like',
      },
    });

    const count = await prisma.interaction.count({
      where: {
        postId,
        type: 'like',
      },
    });

    return apiSuccess({ liked: false, count });
  } catch (error) {
    return apiError('Failed to unlike post', 500);
  }
}

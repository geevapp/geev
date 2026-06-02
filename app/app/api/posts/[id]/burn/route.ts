import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    const { id: postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, moderationStatus: true },
    });

    if (!post) return apiError('Post not found', 404);
    if (['suspended', 'banned'].includes(post.moderationStatus)) {
      return apiError('Cannot burn moderated content', 403);
    }

    // Insert burn (ignore if already exists)
    await prisma.interaction.upsert({
      where: {
        userId_postId_type: {
          userId: user.id,
          postId,
          type: 'burn',
        },
      },
      update: {},
      create: {
        userId: user.id,
        postId,
        type: 'burn',
      },
    });

    // Get updated count
    const count = await prisma.interaction.count({
      where: {
        postId,
        type: 'burn',
      },
    });

    return apiSuccess({ burned: true, count });
  } catch (error) {
    return apiError('Failed to burn post', 500);
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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, moderationStatus: true },
    });

    if (!post) return apiError('Post not found', 404);
    if (['suspended', 'banned'].includes(post.moderationStatus)) {
      return apiError('Cannot unburn moderated content', 403);
    }

    await prisma.interaction.deleteMany({
      where: {
        userId: user.id,
        postId,
        type: 'burn',
      },
    });

    const count = await prisma.interaction.count({
      where: {
        postId,
        type: 'burn',
      },
    });

    return apiSuccess({ burned: false, count });
  } catch (error) {
    return apiError('Failed to unburn post', 500);
  }
}

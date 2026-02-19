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

    // Insert like (ignore if already exists)
    await prisma.interaction.upsert({
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

    // Get updated count
    const count = await prisma.interaction.count({
      where: {
        postId,
        type: 'like',
      },
    });

    return apiSuccess({ liked: true, count });
  } catch (error) {
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

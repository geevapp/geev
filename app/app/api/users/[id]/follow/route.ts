import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return apiError('Unauthorized', 401);

    const { id: targetUserId } = await params;

    if (currentUser.id === targetUserId) {
      return apiError('Cannot follow yourself', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return apiError('User not found', 404);
    }

    // Use findFirst then create instead of upsert since the compound index has an optional field
    // which may cause issues if we aren't careful, though Prisma supports it.
    const existing = await prisma.follow.findUnique({
      where: {
        userId_followingId: {
          userId: currentUser.id,
          followingId: targetUserId,
        }
      }
    });

    if (!existing) {
      const follow = await prisma.follow.create({
        data: {
          userId: currentUser.id,
          followingId: targetUserId,
        }
      });
      return apiSuccess({ success: true, follow }, undefined, 201);
    }

    return apiSuccess({ success: true, follow: existing }, undefined, 200);
  } catch (error) {
    console.error('Failed to follow user:', error);
    return apiError('Failed to follow user', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return apiError('Unauthorized', 401);

    const { id: targetUserId } = await params;

    try {
      await prisma.follow.delete({
        where: {
          userId_followingId: {
            userId: currentUser.id,
            followingId: targetUserId,
          }
        }
      });
    } catch(e) {
      // Ignore if not found
    }

    return apiSuccess({ success: true }, undefined, 200);
  } catch (error) {
    console.error('Failed to unfollow user:', error);
    return apiError('Failed to unfollow user', 500);
  }
}

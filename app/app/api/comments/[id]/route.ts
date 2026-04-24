import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return apiError('Unauthorized', 401);

    const { id } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return apiError('Comment not found', 404);
    }

    if (comment.userId !== currentUser.id) {
      return apiError('Forbidden', 403);
    }

    await prisma.comment.delete({
      where: { id }
    });

    return apiSuccess({ success: true });
  } catch (error) {
    return apiError('Failed to delete comment', 500);
  }
}

import { apiError, apiSuccess } from '@/lib/api-response';
import type { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    const { commentId } = await params;
    if (!commentId) return apiError('Comment id is required', 400);

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return apiError('Comment not found', 404);

    if (comment.userId !== user.id) {
      return apiError('Forbidden', 403);
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return apiSuccess(null, 'Comment deleted successfully', 200);
  } catch (error) {
    return apiError('Failed to delete comment', 500);
  }
}

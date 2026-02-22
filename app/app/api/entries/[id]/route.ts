import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

/**
 * DELETE /api/entries/[id]
 * Delete a user's own entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    const { id: entryId } = await params;

    // Find the entry
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: {
        id: true,
        userId: true,
        post: {
          select: {
            status: true,
            endsAt: true,
          },
        },
      },
    });

    if (!entry) {
      return apiError('Entry not found', 404);
    }

    // Verify ownership
    if (entry.userId !== user.id) {
      return apiError('You can only delete your own entries', 403);
    }

    // Check if post is still open (optional: allow deletion only while post is open)
    if (entry.post.status !== 'open' || new Date(entry.post.endsAt) < new Date()) {
      return apiError('Cannot delete entry after post has closed or ended', 400);
    }

    // Delete the entry
    await prisma.entry.delete({
      where: { id: entryId },
    });

    return apiSuccess(
      { id: entryId },
      'Entry deleted successfully',
      200
    );
  } catch (error) {
    console.error('Failed to delete entry:', error);
    return apiError('Failed to delete entry', 500);
  }
}

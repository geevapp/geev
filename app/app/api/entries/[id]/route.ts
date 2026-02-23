import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

/**
 * DELETE /api/entries/[id]
 * Delete an entry (only the owner can delete their own entry)
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
      include: {
        post: {
          select: { status: true },
        },
      },
    });

    if (!entry) {
      return apiError('Entry not found', 404);
    }

    // Check ownership
    if (entry.userId !== user.id) {
      return apiError('You can only delete your own entries', 403);
    }

    // Check if post is still open
    if (entry.post.status !== 'open') {
      return apiError('Cannot delete entry from a closed or completed post', 400);
    }

    // Delete the entry
    await prisma.entry.delete({
      where: { id: entryId },
    });

    return apiSuccess({ id: entryId }, 'Entry deleted successfully', 200);
  } catch (error) {
    console.error('Error deleting entry:', error);
    return apiError('Failed to delete entry', 500);
  }
}

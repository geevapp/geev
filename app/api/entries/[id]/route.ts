/**
 * API route for individual entry operations
 * Handles DELETE operation to remove an entry
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

// Mock data for entries
let mockEntries: any[] = [
  {
    id: 'entry-1',
    postId: 'post-1',
    userId: 'user-1',
    content: 'I would love to win this amazing giveaway! I\'ve been following the community for months and always wanted to contribute more.',
    proofUrl: 'https://example.com/proof.jpg',
    isWinner: false,
    createdAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: 'entry-2',
    postId: 'post-1',
    userId: 'user-2',
    content: 'This looks incredible! Count me in for this awesome opportunity.',
    proofUrl: null,
    isWinner: false,
    createdAt: new Date('2024-01-15T11:45:00Z'),
  },
  {
    id: 'entry-3',
    postId: 'post-2',
    userId: 'user-1',
    content: 'Happy to help with this request! I have a spare laptop that might work.',
    proofUrl: null,
    isWinner: false,
    createdAt: new Date('2024-01-14T15:20:00Z'),
  },
];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const { id: entryId } = await params;

    // Find the entry
    const entryIndex = mockEntries.findIndex(e => e.id === entryId);
    
    if (entryIndex === -1) {
      return apiError('Entry not found', 404);
    }

    const entry = mockEntries[entryIndex];

    // Check if user owns this entry
    if (entry.userId !== user.id) {
      return apiError('You can only delete your own entries', 403);
    }

    // Check if post is still open (optional - you might allow deletion even after post closes)
    // For now, we'll allow deletion at any time

    // Delete the entry
    const deletedEntry = mockEntries.splice(entryIndex, 1)[0];

    // In a real implementation with Prisma:
    /*
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return apiError('Entry not found', 404);
    }

    if (entry.userId !== user.id) {
      return apiError('You can only delete your own entries', 403);
    }

    await prisma.entry.delete({
      where: { id: entryId },
    });
    */

    return apiSuccess(deletedEntry, 'Entry deleted successfully');
  } catch (error) {
    console.error('Delete entry error:', error);
    return apiError('Failed to delete entry', 500);
  }
}

// Optional: Add GET endpoint to fetch a single entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication is optional for viewing entries, but you might want to require it
    // const user = await getCurrentUser(request);
    // if (!user) {
    //   return apiError('Unauthorized', 401);
    // }

    const { id: entryId } = await params;

    // Find the entry
    const entry = mockEntries.find(e => e.id === entryId);
    
    if (!entry) {
      return apiError('Entry not found', 404);
    }

    // In a real implementation with Prisma:
    /*
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            endsAt: true,
          },
        },
      },
    });

    if (!entry) {
      return apiError('Entry not found', 404);
    }
    */

    return apiSuccess(entry);
  } catch (error) {
    console.error('Fetch entry error:', error);
    return apiError('Failed to fetch entry', 500);
  }
}

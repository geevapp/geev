/**
 * API route for retrieving a user's entry history
 * Handles GET operation to list all entries by a specific user
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

// Mock data for entries
const mockEntries: any[] = [
  {
    id: 'entry-1',
    postId: 'post-1',
    userId: 'user-1',
    content: 'I would love to win this amazing giveaway! I\'ve been following the community for months and always wanted to contribute more.',
    proofUrl: 'https://example.com/proof.jpg',
    isWinner: false,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    post: {
      id: 'post-1',
      title: 'Amazing Crypto Giveaway!',
      description: 'Win 1000 XLM tokens by participating in our community event',
      category: 'giveaway',
      status: 'open',
    },
  },
  {
    id: 'entry-2',
    postId: 'post-2',
    userId: 'user-1',
    content: 'Happy to help with this request! I have a spare laptop that might work.',
    proofUrl: null,
    isWinner: false,
    createdAt: new Date('2024-01-14T15:20:00Z'),
    post: {
      id: 'post-2',
      title: 'Help Request: Laptop Needed',
      description: 'Need a laptop for online classes. Any help would be appreciated!',
      category: 'help-request',
      status: 'open',
    },
  },
  {
    id: 'entry-3',
    postId: 'post-3',
    userId: 'user-2',
    content: 'Excited to participate in this community event!',
    proofUrl: null,
    isWinner: true,
    createdAt: new Date('2024-01-10T09:15:00Z'),
    post: {
      id: 'post-3',
      title: 'Weekly Community Challenge',
      description: 'Show us your creative projects for a chance to win prizes',
      category: 'giveaway',
      status: 'completed',
    },
  },
];

// Mock users data
const mockUsers: any[] = [
  {
    id: 'user-1',
    name: 'Alex Chen',
    username: 'alexchen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  },
  {
    id: 'user-2',
    name: 'Sarah Johnson',
    username: 'sarahj',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return apiError('Unauthorized', 401);
    }

    const { id: userId } = await params;

    // In a real app, you might want to check if the user is authorized to view these entries
    // For now, we'll allow users to view their own entries or make it public
    
    // Check if user exists
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return apiError('User not found', 404);
    }

    // Get entries for this user
    const entries = mockEntries
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(entry => ({
        ...entry,
        user: undefined, // Remove user object since we're already filtering by user
      }));

    // In a real implementation with Prisma:
    /*
    const entries = await prisma.entry.findMany({
      where: { userId },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    */

    return apiSuccess({
      userId,
      userName: user.name,
      userAvatar: user.avatar,
      entries,
      totalEntries: entries.length,
    });
  } catch (error) {
    console.error('Fetch user entries error:', error);
    return apiError('Failed to fetch user entries', 500);
  }
}

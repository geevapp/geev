import { NextRequest } from 'next/server';
import { mockUsers, mockPosts, mockEntries } from '@/lib/mock-data';
import { User } from '@/lib/types';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Find user in mock data
    const user = mockUsers.find((u: User) => u.id === id);
    if (!user) {
      return apiError('User not found', 404);
    }

    // Calculate stats from mock data
    const totalPosts = mockPosts.filter((post: any) => post.authorId === id).length;
    const totalEntries = mockEntries.filter((entry: any) => entry.userId === id).length;
    
    // Calculate wins by checking if user's entries are in post winners array
    let wins = 0;
    const userEntries = mockEntries.filter((entry: any) => entry.userId === id);
    
    for (const entry of userEntries) {
      const post = mockPosts.find((p: any) => p.id === entry.postId);
      if (post && post.winners && post.winners.includes(id)) {
        wins++;
      }
    }

    return apiSuccess({
      total_posts: totalPosts,
      total_entries: totalEntries,
      wins,
      xp: user.walletBalance || 0, // Using wallet balance as XP for mock purposes
    });

  } catch (error) {
    return apiError('Failed to fetch stats', 500);
  }
}
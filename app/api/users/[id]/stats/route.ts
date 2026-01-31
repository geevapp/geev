import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Try to fetch from database first
    try {
      // Fetch user to verify existence
      const user = await prisma.user.findUnique({
        where: { id },
        select: { xp: true },
      });

      if (!user) {
        return apiError('User not found', 404);
      }

      // Calculate stats using database queries
      const [totalPosts, totalEntries, wins] = await Promise.all([
        prisma.post.count({
          where: { creatorId: id },
        }),
        prisma.entry.count({
          where: { userId: id },
        }),
        prisma.entry.count({
          where: { 
            userId: id, 
            isWinner: true 
          },
        }),
      ]);

      return apiSuccess({
        total_posts: totalPosts,
        total_entries: totalEntries,
        wins,
        xp: user.xp || 0,
      });
    } catch (dbError) {
      console.log('Database not available, falling back to mock data');
      // Fallback stats calculation
      return apiError('Database not available', 500);
    }

  } catch (error) {
    return apiError('Failed to fetch stats', 500);
  }
}
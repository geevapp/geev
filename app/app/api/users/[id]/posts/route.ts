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
      // Verify user exists
      const userExists = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!userExists) {
        return apiError('User not found', 404);
      }

      // Fetch user's posts
      const userPosts = await prisma.post.findMany({
        where: { creatorId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          entries: {
            select: {
              id: true,
              userId: true,
              content: true,
              isWinner: true,
              createdAt: true,
            },
          },
        },
      });

      return apiSuccess(userPosts);

    } catch (dbError) {
      console.log('Database not available');
      return apiError('Database not available', 500);
    }

  } catch (error) {
    return apiError('Failed to fetch user posts', 500);
  }
}
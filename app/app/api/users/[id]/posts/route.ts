import { apiError, apiSuccess } from '@/lib/api-response';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET (
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

      // Fetch user's posts (shape aligned with feed/detail for PostCard)
      const userPosts = await prisma.post.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              username: true,
              rank: {
                select: {
                  id: true,
                  level: true,
                  title: true,
                  color: true,
                  minPoints: true,
                  maxPoints: true,
                },
              },
            },
          },
          media: true,
          entries: {
            select: {
              id: true,
              userId: true,
              content: true,
              isWinner: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              entries: true,
              interactions: true,
              comments: true,
            },
          },
        },
      });

      return apiSuccess(userPosts);

    } catch (dbError) {
      return apiError('Failed to fetch user posts', 500);
    }

  } catch (error) {
    return apiError('Failed to fetch user posts', 500);
  }
}
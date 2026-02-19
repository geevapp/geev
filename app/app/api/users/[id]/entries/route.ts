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

      // Fetch user's entries
      const userEntries = await prisma.entry.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      return apiSuccess(userEntries);

    } catch (dbError) {
      console.log('Database not available');
      return apiError('Database not available', 500);
    }

  } catch (error) {
    return apiError('Failed to fetch user entries', 500);
  }
}
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: postId } = await params;

    const [likes, burns, entries] = await Promise.all([
      prisma.interaction.count({
        where: { postId, type: 'like' },
      }),
      prisma.interaction.count({
        where: { postId, type: 'burn' },
      }),
      prisma.entry.count({
        where: { postId },
      }),
    ]);

    return apiSuccess({ likes, burns, entries });
  } catch (error) {
    return apiError('Failed to fetch stats', 500);
  }
}

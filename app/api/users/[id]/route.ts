import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Try to fetch from database first
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          walletAddress: true,
          name: true,
          bio: true,
          avatarUrl: true,
          xp: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (user) {
        return apiSuccess(user);
      }
    } catch (dbError) {
      console.log('Database not available, falling back to mock data');
    }

    // Fallback to mock data if database is not available
    // Note: In production, this fallback should be removed
    return apiError('User not found', 404);

  } catch (error) {
    return apiError('Failed to fetch user', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return apiError('Unauthorized', 401);

    const { id } = await params;

    // Check if user is updating their own profile
    if (currentUser.id !== id) {
      return apiError('Can only update own profile', 403);
    }

    const { name, bio } = await request.json();

    // Try to update in database first
    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(bio !== undefined && { bio }),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          walletAddress: true,
          name: true,
          bio: true,
          avatarUrl: true,
          xp: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return apiSuccess(updatedUser);
    } catch (dbError) {
      console.log('Database not available, cannot update user');
      return apiError('Database not available', 500);
    }

  } catch (error) {
    return apiError('Failed to update profile', 500);
  }
}
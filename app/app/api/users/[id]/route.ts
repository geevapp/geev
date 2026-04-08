import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { readJsonBody } from '@/lib/parse-json-body';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    try {
      const currentUser = await getCurrentUser(request);

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          badges: {
            include: {
              badge: true,
            },
          },
          rank: true,
          _count: {
            select: {
              posts: true,
              entries: true,
              comments: true,
              interactions: true,
              badges: true,
              followers: true,
              helpContributions: true,
            },
          },
        select: {
          id: true,
          walletAddress: true,
          name: true,
          username: true,
          bio: true,
          email: true,
          avatarUrl: true,
          xp: true,
          walletBalance: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              followers: true,
              followings: true,
            }
          }
        },
      });

      if (user) {
        // Return only the fields we want to expose
        const normalizedUser = {
          id: user.id,
          walletAddress: user.walletAddress,
          name: user.name,
          username: user.username,
          bio: user.bio,
          email: user.email,
          avatarUrl: user.avatarUrl,
          xp: user.xp,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          badges: user.badges.map((userBadge) => ({
            ...userBadge.badge,
            awardedAt: userBadge.awardedAt,
          })),
          rank: user.rank,
          _count: user._count,
        };
        return apiSuccess(normalizedUser);
        let isFollowing = false;
        if (currentUser) {
          const follow = await prisma.follow.findUnique({
            where: {
              userId_followingId: {
                userId: currentUser.id,
                followingId: id,
              }
            }
          });
          isFollowing = !!follow;
        }

        return apiSuccess({ ...user, isFollowing });
      }
    } catch (dbError) {
      // Database error - fallback already handled above
    }

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

    if (currentUser.id !== id) {
      return apiError('Can only update own profile', 403);
    }

    const raw = await readJsonBody<Record<string, unknown>>(request);
    if (!raw.ok) return raw.response;
    const { name, username, bio, email } = raw.data;

    try {
      // --- Uniqueness checks ---
      // These run as a single query each so we can return a field-specific error
      // message instead of letting Prisma throw a generic unique-constraint error.
      if (username !== undefined) {
        const existing = await prisma.user.findFirst({
          where: { username, NOT: { id } },
          select: { id: true },
        });
        if (existing) {
          return apiError('Username is already taken', 409);
        }
      }

      if (email !== undefined) {
        const existing = await prisma.user.findFirst({
          where: { email, NOT: { id } },
          select: { id: true },
        });
        if (existing) {
          return apiError('Email address is already in use', 409);
        }
      }

      // --- Perform the update ---
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(username !== undefined && { username }),
          ...(bio !== undefined && { bio }),
          ...(email !== undefined && { email }),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          walletAddress: true,
          name: true,
          username: true,
          bio: true,
          email: true,
          avatarUrl: true,
          xp: true,
          walletBalance: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return apiSuccess(updatedUser);
    } catch (dbError) {
      return apiError('Failed to update profile', 500);
    }
  } catch (error) {
    return apiError('Failed to update profile', 500);
  }
}
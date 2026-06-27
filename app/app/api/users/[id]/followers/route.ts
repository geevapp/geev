import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: targetUserId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    const currentUser = await getCurrentUser(request);

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        profileVisibility: true,
        showEmail: true,
        showWalletAddress: true,
      },
    });

    if (!targetUser) {
      return apiError("User not found", 404);
    }

    const isFollowing = currentUser
      ? await prisma.follow.findUnique({
          where: {
            userId_followingId: {
              userId: currentUser.id,
              followingId: targetUserId,
            },
          },
        })
      : null;

    const canAccessFollowers = 
      currentUser?.id === targetUser.id ||
      (targetUser.profileVisibility === 'public') ||
      (targetUser.profileVisibility === 'followers' && isFollowing);

    if (!canAccessFollowers) {
      return apiError("Cannot access followers list", 403);
    }

    // Determine if we should include walletAddress based on user relationship and privacy settings
    const shouldIncludeWalletAddress = currentUser?.id === targetUserId || targetUser.showWalletAddress;

    // Followers are users who follow the target user
    // i.e., followingId = targetUserId
    // we want to return the `user` relation (the follower)
    const followers = await prisma.follow.findMany({
      where: { followingId: targetUserId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            xp: true,
            bio: true,
            ...(shouldIncludeWalletAddress && { walletAddress: true }),
          }
        }
      },
      take: limit,
      skip,
      orderBy: { id: 'desc' }
    });

    const total = await prisma.follow.count({
      where: { followingId: targetUserId }
    });

    return apiSuccess({
      items: followers.map(f => f.user).filter(Boolean),
      total,
      limit,
      skip
    });
  } catch (error) {
    console.error('Failed to fetch followers:', error);
    return apiError('Failed to fetch followers', 500);
  }
}

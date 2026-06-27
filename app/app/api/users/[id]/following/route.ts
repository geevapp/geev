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

    const canAccessFollowing = 
      currentUser?.id === targetUser.id ||
      (targetUser.profileVisibility === 'public') ||
      (targetUser.profileVisibility === 'followers' && isFollowing);

    if (!canAccessFollowing) {
      return apiError("Cannot access following list", 403);
    }

    // Determine if we should include walletAddress based on user relationship and privacy settings
    const shouldIncludeWalletAddress = currentUser?.id === targetUserId || targetUser.showWalletAddress;

    // Following are users the target user follows
    // i.e., userId = targetUserId, followingId != null
    // we want to return the `following` relation (the person being followed)
    const following = await prisma.follow.findMany({
      where: { userId: targetUserId, followingId: { not: null } },
      include: {
        following: {
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
      where: { userId: targetUserId, followingId: { not: null } }
    });

    return apiSuccess({
      items: following.map(f => f.following).filter(Boolean),
      total,
      limit,
      skip
    });
  } catch (error) {
    console.error('Failed to fetch following:', error);
    return apiError('Failed to fetch following', 500);
  }
}

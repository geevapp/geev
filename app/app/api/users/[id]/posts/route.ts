import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const currentUser = await getCurrentUser(request);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        profileVisibility: true,
        showEmail: true,
        showWalletAddress: true,
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    const isFollowing = currentUser
      ? await prisma.follow.findUnique({
          where: {
            userId_followingId: {
              userId: currentUser.id,
              followingId: id,
            },
          },
        })
      : null;

    const canAccessProfile =
      currentUser?.id === user.id ||
      user.profileVisibility === 'public' ||
      (user.profileVisibility === 'followers' && isFollowing);

    if (!canAccessProfile) {
      return apiError("Profile not accessible", 403);
    }

    // Fetch user's posts
    const userPosts = await prisma.post.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
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
  } catch (error) {
    return apiError("Failed to fetch user posts", 500);
  }
}
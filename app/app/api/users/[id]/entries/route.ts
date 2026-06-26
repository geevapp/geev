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

    // Fetch user's entries
    const userEntries = await prisma.entry.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
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
  } catch (error) {
    return apiError("Failed to fetch user entries", 500);
  }
}
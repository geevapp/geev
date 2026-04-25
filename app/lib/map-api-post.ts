import type { Post, PostStatus } from "@/lib/types";

/**
 * Maps a post object from the API (Prisma shape) to the client `Post` shape.
 */
export function mapApiPostToClientPost(apiPost: Record<string, unknown> | null | undefined): Post | null {
  if (!apiPost || typeof apiPost !== "object") return null;

  const rawStatus = apiPost.status as string | undefined;
  const normalizedStatus: PostStatus =
    rawStatus === "open" || rawStatus === "in_progress"
      ? "active"
      : (rawStatus as PostStatus) ?? "active";

  const user = apiPost.user as Record<string, unknown> | undefined;
  const fallbackUsername =
    typeof user?.name === "string"
      ? user.name.toLowerCase().replace(/\s+/g, "")
      : "user";

  const _count = apiPost._count as Record<string, number> | undefined;

  return {
    ...apiPost,
    type: apiPost.type as Post["type"],
    userId: (apiPost.userId as string) ?? (user?.id as string) ?? "",
    status: normalizedStatus,
    createdAt: apiPost.createdAt ? new Date(apiPost.createdAt as string) : new Date(),
    updatedAt: apiPost.updatedAt ? new Date(apiPost.updatedAt as string) : new Date(),
    endDate: apiPost.endsAt ? new Date(apiPost.endsAt as string) : undefined,
    burnCount: (apiPost.burnCount as number) ?? 0,
    shareCount: (apiPost.shareCount as number) ?? 0,
    commentCount:
      (apiPost.commentCount as number) ??
      (typeof _count?.comments === "number" ? _count.comments : 0),
    likesCount:
      (apiPost.likesCount as number) ??
      (typeof _count?.interactions === "number" ? _count.interactions : 0),
    entriesCount:
      (apiPost.entriesCount as number) ??
      (typeof _count?.entries === "number" ? _count.entries : 0) ??
      (Array.isArray(apiPost.entries) ? apiPost.entries.length : 0),
    author: {
      id: (user?.id as string) ?? (apiPost.userId as string) ?? "",
      name: (user?.name as string) ?? "Unknown User",
      username: (user?.username as string) ?? fallbackUsername,
      avatarUrl: user?.avatarUrl as string | undefined,
      rank: user?.rank,
    },
  } as Post;
}

import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/parse-json-body";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

const actionSchema = z.object({
  postId: z.string().uuid("A valid postId is required"),
  action: z.enum([
    "approve",
    "review",
    "suspend",
    "ban",
    "clear",
    "verify_creator",
  ]),
  note: z.string().max(500).optional(),
});

const actionToStatus = {
  approve: "approved",
  review: "under_review",
  suspend: "suspended",
  ban: "banned",
  clear: "none",
  verify_creator: "approved",
} as const;

const moderationStatusSchema = z.enum([
  "none",
  "flagged",
  "under_review",
  "suspended",
  "banned",
  "approved",
]);

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Forbidden", 403);

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit") || 25), 100);
    const parsedStatus =
      status && status !== "all"
        ? moderationStatusSchema.safeParse(status)
        : null;

    if (parsedStatus && !parsedStatus.success) {
      return apiError("Invalid moderation status", 400);
    }

    const where: Prisma.PostWhereInput =
      parsedStatus?.success
        ? { moderationStatus: parsedStatus.data }
        : {
            OR: [
              { contentFlags: { some: {} } },
              {
                moderationStatus: {
                  in: ["under_review", "suspended", "banned"],
                },
              },
            ],
          };

    const posts = await prisma.post.findMany({
      where,
      take: limit,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            walletAddress: true,
            isVerified: true,
            role: true,
          },
        },
        contentFlags: {
          orderBy: { createdAt: "desc" },
          include: {
            flaggedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        moderationActions: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            moderator: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            entries: true,
            comments: true,
            interactions: true,
            contributions: true,
            contentFlags: true,
          },
        },
      },
    });

    const totals = await prisma.post.groupBy({
      by: ["moderationStatus"],
      where: {
        OR: [
          { contentFlags: { some: {} } },
          { moderationStatus: { not: "none" } },
        ],
      },
      _count: { _all: true },
    });

    return apiSuccess({
      posts,
      totals: totals.reduce<Record<string, number>>((acc, row) => {
        acc[row.moderationStatus] = row._count._all;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Moderation dashboard fetch error:", error);
    return apiError("Failed to fetch moderation queue", 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Forbidden", 403);

  try {
    const raw = await readJsonBody<Record<string, unknown>>(request);
    if (!raw.ok) return raw.response;

    const parsed = actionSchema.safeParse(raw.data);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { postId, action, note } = parsed.data;
    const moderationStatus = actionToStatus[action];

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        userId: true,
        title: true,
      },
    });

    if (!existingPost) {
      return apiError("Post not found", 404);
    }

    const updatedPost = await prisma.$transaction(async (tx) => {
      if (action === "verify_creator") {
        await tx.user.update({
          where: { id: existingPost.userId },
          data: { isVerified: true },
        });
      }

      const post = await tx.post.update({
        where: { id: postId },
        data: { moderationStatus },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              isVerified: true,
              role: true,
            },
          },
          _count: {
            select: {
              contentFlags: true,
              comments: true,
              entries: true,
              interactions: true,
            },
          },
        },
      });

      await tx.moderationAction.create({
        data: {
          postId,
          moderatorId: admin.id,
          action: moderationStatus,
          note:
            note ||
            (action === "verify_creator"
              ? "Creator verified from moderation dashboard"
              : null),
        },
      });

      return post;
    });

    return apiSuccess(updatedPost, "Moderation action recorded");
  } catch (error) {
    console.error("Moderation action error:", error);
    return apiError("Failed to record moderation action", 500);
  }
}

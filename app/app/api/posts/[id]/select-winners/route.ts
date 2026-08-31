import { apiError, apiSuccess } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/parse-json-body";
import { z } from "zod";
import { checkAndAwardBadges } from "@/lib/badges";
import { fanOutNotificationsInTransaction } from "@/lib/notifications";

// ── Per-method request schemas ────────────────────────────────────────────────

const randomSchema = z.object({
  method: z.literal("random"),
  count: z.number().int().positive().optional(),
});

const manualSchema = z.object({
  method: z.literal("manual"),
  entryIds: z
    .array(z.string().uuid("Each entryId must be a valid UUID"))
    .min(1, "At least one entryId is required"),
});

const meritSchema = z.object({
  method: z.literal("merit_based"),
  count: z.number().int().positive().optional(),
});

const firstcomeSchema = z.object({
  method: z.literal("firstcome"),
  count: z.number().int().positive().optional(),
});

const selectWinnersSchema = z.discriminatedUnion("method", [
  randomSchema,
  manualSchema,
  meritSchema,
  firstcomeSchema,
]);

// ── Fisher-Yates shuffle ──────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const { id } = await params;
    const raw = await readJsonBody<Record<string, unknown>>(request);
    if (!raw.ok) return raw.response;

    const parsed = selectWinnersSchema.safeParse(raw.data);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }
    const body = parsed.data;

    // ── Pre-transaction ownership & moderation checks (read-only) ───────
    const preCheck = await prisma.post.findUnique({
      where: { id },
      select: {
        userId: true,
        moderationStatus: true,
      },
    });

    if (!preCheck) return apiError("Post not found", 404);
    if (preCheck.userId !== user.id) return apiError("Forbidden", 403);
    if (["suspended", "banned"].includes(preCheck.moderationStatus)) {
      return apiError("Cannot select winners for moderated content", 403);
    }

    // ── Atomic transaction: re-read status, select winners, persist ─────
    // Serializable isolation prevents two concurrent requests from both
    // passing the "already completed" guard and over-selecting winners.
    const result = await prisma.$transaction(
      async (tx) => {
        // Re-read the post with fresh status + winner count inside the transaction
        const post = await tx.post.findUnique({
          where: { id },
          include: {
            entries: {
              include: { burns: true },
              orderBy: { createdAt: "asc" },
            },
            winners: true,
          },
        });

        if (!post) throw new Error("Post not found");

        if (post.status === "completed") {
          throw new Error("ALREADY_COMPLETED");
        }
        if (!["open", "active", "in_progress"].includes(post.status)) {
          throw new Error(
            `Cannot select winners for a post with status "${post.status}"`,
          );
        }
        if (post.entries.length === 0) {
          throw new Error("No entries to select from");
        }

        // Compute eligibility and remaining slots inside the transaction
        const existingWinnerUserIds = new Set(post.winners.map((w) => w.userId));
        const eligibleEntries = post.entries.filter(
          (e) => !existingWinnerUserIds.has(e.userId),
        );

        const maxWinners = post.maxWinners ?? 1;
        const remainingSlots = Math.max(0, maxWinners - post.winners.length);

        if (remainingSlots === 0) {
          throw new Error("ALREADY_COMPLETED");
        }

        let selectedEntries: typeof eligibleEntries = [];

        switch (body.method) {
          case "random": {
            const count = Math.min(
              body.count ?? remainingSlots,
              remainingSlots,
              eligibleEntries.length,
            );
            selectedEntries = shuffle(eligibleEntries).slice(0, count);
            break;
          }

          case "manual": {
            const { entryIds } = body;

            // All supplied IDs must belong to this post
            const validEntryIds = new Set(post.entries.map((e) => e.id));
            const invalidIds = entryIds.filter((eid) => !validEntryIds.has(eid));
            if (invalidIds.length > 0) {
              throw new Error(
                `Entry IDs not found on this post: ${invalidIds.join(", ")}`,
              );
            }

            // Deduplicate supplied IDs and cap at remainingSlots
            const uniqueIds = [...new Set(entryIds)].slice(0, remainingSlots);
            selectedEntries = eligibleEntries.filter((e) =>
              uniqueIds.includes(e.id),
            );

            if (selectedEntries.length === 0) {
              throw new Error(
                "None of the provided entry IDs belong to eligible entries",
              );
            }
            break;
          }

          case "merit_based": {
            // Rank by burn count (descending), then entry age (ascending) as tiebreaker
            const count = Math.min(
              body.count ?? remainingSlots,
              remainingSlots,
              eligibleEntries.length,
            );
            selectedEntries = [...eligibleEntries]
              .sort((a, b) => {
                const burnDiff = b.burns.length - a.burns.length;
                if (burnDiff !== 0) return burnDiff;
                return a.createdAt.getTime() - b.createdAt.getTime();
              })
              .slice(0, count);
            break;
          }

          case "firstcome": {
            // Entries are already ordered by createdAt asc
            const count = Math.min(
              body.count ?? remainingSlots,
              remainingSlots,
              eligibleEntries.length,
            );
            selectedEntries = eligibleEntries.slice(0, count);
            break;
          }
        }

        if (selectedEntries.length === 0) {
          throw new Error(
            "No eligible entries found for the requested selection",
          );
        }

        const entryIds = selectedEntries.map((e) => e.id);

        await tx.entry.updateMany({
          where: { id: { in: entryIds } },
          data: { isWinner: true },
        });

        await tx.postWinner.createMany({
          data: selectedEntries.map((e) => ({
            postId: post.id,
            userId: e.userId,
            assignedBy: user.id,
          })),
          skipDuplicates: true,
        });

        await tx.post.update({
          where: { id: post.id },
          data: { status: "completed" },
        });

        // Notify each winner using delivery layer
        const fanOut = fanOutNotificationsInTransaction(tx);
        await fanOut({
          userIds: selectedEntries.map((e) => e.userId),
          type: "giveaway_win",
          message: `Congratulations! You won the giveaway "${post.title}".`,
          link: `/posts/${post.id}`,
        });

        return {
          postId: post.id,
          selectedEntries,
        };
      },
      {
        isolationLevel: "Serializable",
      },
    );

    // Award badges to winners async (best-effort)
    for (const entry of result.selectedEntries) {
      checkAndAwardBadges(entry.userId).catch(console.error);
    }

    return apiSuccess(
      {
        method: body.method,
        postId: result.postId,
        postStatus: "completed",
        totalSelected: result.selectedEntries.length,
        winners: result.selectedEntries.map((e) => ({
          entryId: e.id,
          userId: e.userId,
        })),
      },
      "Winners selected successfully",
    );
  } catch (error) {
    // Surface domain errors as 400 responses instead of 500
    if (error instanceof Error) {
      switch (error.message) {
        case "Post not found":
          return apiError("Post not found", 404);
        case "ALREADY_COMPLETED":
          return apiError("Winners already selected for this post", 400);
        case "No entries to select from":
          return apiError("No entries to select from", 400);
        case "No eligible entries found for the requested selection":
          return apiError(
            "No eligible entries found for the requested selection",
            400,
          );
        default:
          if (error.message.startsWith("Cannot select winners")) {
            return apiError(error.message, 400);
          }
          if (error.message.startsWith("Entry IDs not found")) {
            return apiError(error.message, 400);
          }
          if (error.message.startsWith("None of the provided")) {
            return apiError(error.message, 400);
          }
          break;
      }
    }
    console.error("Select winners error:", error);
    return apiError("Failed to select winners", 500);
  }
};

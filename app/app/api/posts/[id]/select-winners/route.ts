import { apiError, apiSuccess } from "@/lib/api-response";
import { Prisma } from "@prisma/client";
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

// Tagged on errors thrown inside the selection transaction so the catch block
// can turn them back into the matching HTTP response after the rollback.
function txError(message: string, status: number) {
  return Object.assign(new Error(message), { httpStatus: status });
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

    let postId = "";
    let selectedEntries: Array<{ id: string; userId: string }> = [];

    try {
      // ── Read, validate, select and persist in one transaction ──────────
      // Eligibility, the "already completed" guard and the winner writes must
      // share a transaction: otherwise two concurrent requests both pass the
      // guard on stale data and over-select.
      const txResult = await prisma.$transaction(
        async (tx) => {
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

          if (!post) throw txError("Post not found", 404);
          if (post.userId !== user.id) throw txError("Forbidden", 403);
          if (["suspended", "banned"].includes(post.moderationStatus)) {
            throw txError("Cannot select winners for moderated content", 403);
          }

          if (post.status === "completed") {
            throw txError("Winners already selected for this post", 400);
          }
          if (!["open", "active", "in_progress"].includes(post.status)) {
            throw txError(
              `Cannot select winners for a post with status "${post.status}"`,
              400,
            );
          }
          if (post.entries.length === 0) {
            throw txError("No entries to select from", 400);
          }

          // Atomically claim the post for this selection. A concurrent
          // request that already flipped the status affects 0 rows here, so
          // exactly one selection can win the race.
          const claimed = await tx.post.updateMany({
            where: {
              id: post.id,
              status: { in: ["open", "active", "in_progress"] },
            },
            data: { status: "completed" },
          });
          if (claimed.count === 0) {
            throw txError("Winners already selected for this post", 400);
          }

          // Exclude users who are already winners (prevents duplicates across calls)
          const existingWinnerUserIds = new Set(
            post.winners.map((w) => w.userId),
          );
          const eligibleEntries = post.entries.filter(
            (e) => !existingWinnerUserIds.has(e.userId),
          );

          const maxWinners = post.maxWinners ?? 1;
          // Remaining slots are computed inside the transaction so concurrent
          // selections cannot collectively assign more than maxWinners.
          const remainingSlots = Math.max(0, maxWinners - post.winners.length);
          if (remainingSlots === 0) {
            throw txError("Winners already selected for this post", 400);
          }

          let selected: typeof eligibleEntries = [];

          switch (body.method) {
            case "random": {
              const count = Math.min(
                body.count ?? maxWinners,
                remainingSlots,
                eligibleEntries.length,
              );
              selected = shuffle(eligibleEntries).slice(0, count);
              break;
            }

            case "manual": {
              const { entryIds } = body;

              // All supplied IDs must belong to this post
              const validEntryIds = new Set(post.entries.map((e) => e.id));
              const invalidIds = entryIds.filter(
                (eid) => !validEntryIds.has(eid),
              );
              if (invalidIds.length > 0) {
                throw txError(
                  `Entry IDs not found on this post: ${invalidIds.join(", ")}`,
                  400,
                );
              }

              // Deduplicate supplied IDs and cap at the remaining slots
              const uniqueIds = [...new Set(entryIds)].slice(
                0,
                remainingSlots,
              );
              selected = eligibleEntries.filter((e) =>
                uniqueIds.includes(e.id),
              );

              if (selected.length === 0) {
                throw txError(
                  "None of the provided entry IDs belong to eligible entries",
                  400,
                );
              }
              break;
            }

            case "merit_based": {
              // Rank by burn count (descending), then entry age (ascending) as tiebreaker
              const count = Math.min(
                body.count ?? maxWinners,
                remainingSlots,
                eligibleEntries.length,
              );
              selected = [...eligibleEntries]
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
                body.count ?? maxWinners,
                remainingSlots,
                eligibleEntries.length,
              );
              selected = eligibleEntries.slice(0, count);
              break;
            }
          }

          if (selected.length === 0) {
            throw txError(
              "No eligible entries found for the requested selection",
              400,
            );
          }

          // Re-check committed winner rows so a concurrent selection can never
          // push the total past maxWinners.
          const winnerCount = await tx.postWinner.count({
            where: { postId: post.id },
          });
          if (winnerCount + selected.length > maxWinners) {
            throw txError("Winners already selected for this post", 400);
          }

          const entryIds = selected.map((e) => e.id);

          await tx.entry.updateMany({
            where: { id: { in: entryIds } },
            data: { isWinner: true },
          });

          await tx.postWinner.createMany({
            data: selected.map((e) => ({
              postId: post.id,
              userId: e.userId,
              assignedBy: user.id,
            })),
            skipDuplicates: true,
          });

          // Notify each winner using delivery layer
          const fanOut = fanOutNotificationsInTransaction(tx);
          await fanOut({
            userIds: selected.map((e) => e.userId),
            type: "giveaway_win",
            message: `Congratulations! You won the giveaway "${post.title}".`,
            link: `/posts/${post.id}`,
          });

          return {
            postId: post.id,
            selectedEntries: selected,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        },
      );

      postId = txResult.postId;
      selectedEntries = txResult.selectedEntries;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        return apiError(
          "Winners are being selected concurrently, please try again",
          409,
        );
      }
      const httpStatus = (error as { httpStatus?: number }).httpStatus;
      if (typeof httpStatus === "number" && error instanceof Error) {
        return apiError(error.message, httpStatus);
      }
      throw error;
    }

    // Award badges to winners async (best-effort)
    for (const entry of selectedEntries) {
      checkAndAwardBadges(entry.userId).catch(console.error);
    }

    return apiSuccess(
      {
        method: body.method,
        postId,
        postStatus: "completed",
        totalSelected: selectedEntries.length,
        winners: selectedEntries.map((e) => ({
          entryId: e.id,
          userId: e.userId,
        })),
      },
      "Winners selected successfully",
    );
  } catch (error) {
    console.error("Select winners error:", error);
    return apiError("Failed to select winners", 500);
  }
};

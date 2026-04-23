import { apiError, apiSuccess } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/parse-json-body";
import { z } from "zod";

// ── Per-method request schemas ────────────────────────────────────────────────

const randomSchema = z.object({
    method: z.literal("random"),
    count: z.number().int().positive().optional(),
});

const manualSchema = z.object({
    method: z.literal("manual"),
    // Strict: only entry IDs are accepted — callers must resolve user→entry mapping
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

        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                entries: {
                    include: { burns: true },
                    orderBy: { createdAt: "asc" },
                },
                winners: true,
            },
        });

        if (!post) return apiError("Post not found", 404);
        if (post.userId !== user.id) return apiError("Forbidden", 403);

        if (post.status === "completed") {
            return apiError("Winners already selected for this post", 400);
        }
        if (!["open", "active", "in_progress"].includes(post.status)) {
            return apiError(`Cannot select winners for a post with status "${post.status}"`, 400);
        }
        if (post.entries.length === 0) {
            return apiError("No entries to select from", 400);
        }

        // Exclude users who are already winners (prevents duplicates across calls)
        const existingWinnerUserIds = new Set(post.winners.map((w) => w.userId));
        const eligibleEntries = post.entries.filter(
            (e) => !existingWinnerUserIds.has(e.userId),
        );

        const maxWinners = post.maxWinners ?? 1;
        let selectedEntries: typeof eligibleEntries = [];

        switch (body.method) {
            case "random": {
                const count = Math.min(body.count ?? maxWinners, eligibleEntries.length);
                selectedEntries = shuffle(eligibleEntries).slice(0, count);
                break;
            }

            case "manual": {
                const { entryIds } = body;

                // All supplied IDs must belong to this post
                const validEntryIds = new Set(post.entries.map((e) => e.id));
                const invalidIds = entryIds.filter((eid) => !validEntryIds.has(eid));
                if (invalidIds.length > 0) {
                    return apiError(
                        `Entry IDs not found on this post: ${invalidIds.join(", ")}`,
                        400,
                    );
                }

                // Deduplicate supplied IDs and cap at maxWinners
                const uniqueIds = [...new Set(entryIds)].slice(0, maxWinners);
                selectedEntries = eligibleEntries.filter((e) => uniqueIds.includes(e.id));

                if (selectedEntries.length === 0) {
                    return apiError("None of the provided entry IDs belong to eligible entries", 400);
                }
                break;
            }

            case "merit_based": {
                // Rank by burn count (descending), then entry age (ascending) as tiebreaker
                const count = Math.min(body.count ?? maxWinners, eligibleEntries.length);
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
                const count = Math.min(body.count ?? maxWinners, eligibleEntries.length);
                selectedEntries = eligibleEntries.slice(0, count);
                break;
            }
        }

        if (selectedEntries.length === 0) {
            return apiError("No eligible entries found for the requested selection", 400);
        }

        // ── Persist in a single transaction ──────────────────────────────────
        await prisma.$transaction(async (tx) => {
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

            // Notify each winner
            await tx.notification.createMany({
                data: selectedEntries.map((e) => ({
                    userId: e.userId,
                    type: "giveaway_win" as const,
                    message: `Congratulations! You won the giveaway "${post.title}".`,
                    link: `/posts/${post.id}`,
                })),
                skipDuplicates: true,
            });
        });

        return apiSuccess(
            {
                method: body.method,
                postId: post.id,
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

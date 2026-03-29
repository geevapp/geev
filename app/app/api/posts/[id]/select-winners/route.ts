import { apiError, apiSuccess } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/parse-json-body";

export const POST = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) => {
    try {
        const user = await getCurrentUser(request);
        if (!user) return apiError('Unauthorized', 401);

        const { id } = await params;
        const raw = await readJsonBody<Record<string, unknown>>(request);
        if (!raw.ok) return raw.response;
        const body = raw.data;

        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                entries: true,
                winners: true,
            },
        });

        if (!post) {
            return apiError('Post not found', 404);
        }

        if (post.userId !== user.id) {
            return apiError('Forbidden', 403);
        }

        if (!['open', 'active', 'in_progress'].includes(post.status)) {
            return apiError(`Cannot select winners for post with status ${post.status}`, 400);
        }

        if (post.winners.length > 0 && post.status === 'completed') {
             return apiError('Winners already selected', 400);
        }

        const method = body.method; // 'random' or 'manual'
        const maxWinners = post.maxWinners || 1;

        let selectedEntries: any[] = [];

        if (method === 'random') {
             if (post.entries.length === 0) {
                 return apiError('No entries to select from', 400);
             }
             const entriesToPickFrom = [...post.entries];
             // shuffle
             for (let i = entriesToPickFrom.length - 1; i > 0; i--) {
                 const j = Math.floor(Math.random() * (i + 1));
                 [entriesToPickFrom[i], entriesToPickFrom[j]] = [entriesToPickFrom[j], entriesToPickFrom[i]];
             }
             
             selectedEntries = entriesToPickFrom.slice(0, maxWinners);
        } else if (method === 'manual') {
             const winnerIds = body.winnerIds as string[]; // this is array of entry ids or user ids? The prompt says `winnerIds?: string[]`. Usually this is entry IDs if selecting by entries, but wait... let's assume it's `entryId` because `post.entries` has `.id`. If they send userIds we can match by `userId`. Let's support `entryId`. Wait, "winnerIds" implies user ids or entry ids. Let's filter post.entries where `entryId` OR `userId` matches just in case.
             if (!winnerIds || !Array.isArray(winnerIds) || winnerIds.length === 0) {
                 return apiError('Manual selection requires winnerIds', 400);
             }
             
             selectedEntries = post.entries.filter(e => winnerIds.includes(e.id) || winnerIds.includes(e.userId));
             if (selectedEntries.length === 0) {
                 return apiError('No valid winners found from provided IDs', 400);
             }
        } else {
             return apiError('Invalid selection method. Must be random or manual', 400);
        }

        await prisma.$transaction(async (tx) => {
            const entryIds = selectedEntries.map(e => e.id);
            await tx.entry.updateMany({
                where: { id: { in: entryIds } },
                data: { isWinner: true }
            });

            const postWinnerData = selectedEntries.map(e => ({
                 postId: post.id,
                 userId: e.userId,
                 assignedBy: user.id
            }));
            await tx.postWinner.createMany({
                 data: postWinnerData,
                 skipDuplicates: true
            });

            await tx.post.update({
                where: { id: post.id },
                data: { status: 'completed' }
            });
        });

        const selectedUsers = selectedEntries.map(e => e.userId);

        return apiSuccess({
             message: 'Winners selected successfully',
             winners: selectedUsers
        });

    } catch (error) {
        console.error("Select winners error:", error);
        return apiError('Failed to select winners', 500);
    }
}

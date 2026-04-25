import { XP_REWARDS, awardXp } from '@/lib/xp';
import { apiError, apiSuccess } from '@/lib/api-response';

import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readJsonBody } from '@/lib/parse-json-body';
import { checkAndAwardBadges } from '@/lib/badges';

function hasEntryProof (proofUrl: unknown, proofImage: unknown): boolean {
  const urlOk = typeof proofUrl === 'string' && proofUrl.trim().length > 0;
  const imgOk = typeof proofImage === 'string' && proofImage.trim().length > 0;
  return urlOk || imgOk;
}

function txError (message: string, status: number) {
  return Object.assign(new Error(message), { httpStatus: status });
}

async function notifyGiveawayEntry (
  tx: Prisma.TransactionClient,
  postOwnerId: string,
  entrantName: string,
  postId: string,
) {
  try {
    await tx.notification.create({
      data: {
        userId: postOwnerId,
        type: 'giveaway_entry',
        message: `${entrantName} entered your giveaway`,
        link: `/post/${postId}`,
      },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    const modelName = String((err as { meta?: { modelName?: string } })?.meta?.modelName || '').toLowerCase();
    if (code === 'P2021' && modelName === 'notification') {
      return;
    }
    throw err;
  }
}

async function notifyGiveawayWins (
  tx: Prisma.TransactionClient,
  userIds: string[],
  postTitle: string,
  postId: string,
) {
  if (userIds.length === 0) return;
  try {
    await tx.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: 'giveaway_win' as const,
        message: `Congratulations! You won the giveaway "${postTitle}".`,
        link: `/post/${postId}`,
      })),
      skipDuplicates: true,
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    const modelName = String((err as { meta?: { modelName?: string } })?.meta?.modelName || '').toLowerCase();
    if (code === 'P2021' && modelName === 'notification') {
      return;
    }
    throw err;
  }
}

/**
 * POST /api/posts/[id]/entries
 * Submit an entry to a giveaway post
 */
export async function POST (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    const { id: postId } = await params;
    const raw = await readJsonBody<Record<string, unknown>>(request);
    if (!raw.ok) return raw.response;
    const body = raw.data;
    const { content, proofUrl, proofImage } = body as {
      content?: unknown;
      proofUrl?: unknown;
      proofImage?: unknown;
    };

    if (!content || typeof content !== 'string') {
      return apiError('Content is required', 400);
    }

    if (content.length < 10 || content.length > 5000) {
      return apiError('Content must be between 10 and 5000 characters', 400);
    }

    let createdEntry: Awaited<ReturnType<typeof prisma.entry.create>>;
    let newlyWinningUserIds: string[] = [];

    try {
      const txResult = await prisma.$transaction(async (tx) => {
        let newlyWinning: string[] = [];
        const post = await tx.post.findUnique({
          where: { id: postId },
          include: {
            requirements: { select: { proofRequired: true } },
            winners: { select: { userId: true } },
          },
        });

        if (!post) {
          throw txError('Post not found', 404);
        }

        if (post.type !== 'giveaway') {
          throw txError('Entries can only be submitted to giveaway posts', 400);
        }

        if (post.status !== 'open') {
          throw txError('Post is not accepting entries', 400);
        }

        if (post.userId === user.id) {
          throw txError('You cannot enter your own giveaway', 403);
        }

        const proofRequired =
          Boolean(post.proofRequired) ||
          Boolean(post.requirements?.proofRequired);

        if (proofRequired && !hasEntryProof(proofUrl, proofImage)) {
          throw txError('Proof is required for this giveaway (provide proofUrl or proofImage)', 400);
        }

        const existingEntry = await tx.entry.findUnique({
          where: {
            postId_userId: {
              postId,
              userId: user.id,
            },
          },
        });

        if (existingEntry) {
          throw txError('You have already entered this giveaway', 400);
        }

        const maxWinners = post.maxWinners ?? 1;

        if (post.selectionMethod === 'firstcome') {
          const entryCount = await tx.entry.count({ where: { postId } });
          if (entryCount >= maxWinners) {
            throw txError('This giveaway has filled all winner slots', 400);
          }
        }

        const proofUrlStr =
          typeof proofUrl === 'string' && proofUrl.trim().length > 0
            ? proofUrl.trim()
            : null;
        const proofImageStr =
          typeof proofImage === 'string' && proofImage.trim().length > 0
            ? proofImage.trim()
            : null;

        const newEntry = await tx.entry.create({
          data: {
            postId,
            userId: user.id,
            content,
            proofUrl: proofUrlStr,
            proofImage: proofImageStr,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                walletAddress: true,
                avatarUrl: true,
              },
            },
          },
        });

        await awardXp(
          user.id,
          XP_REWARDS.enterGiveaway,
          'giveaway_entered',
          {
            metadata: {
              postId,
              entryId: newEntry.id,
            },
          },
          tx,
        );

        await notifyGiveawayEntry(tx, post.userId, user.name, postId);

        if (post.selectionMethod === 'firstcome') {
          const priorWinnerUserIds = new Set(post.winners.map((w) => w.userId));

          const orderedEntries = await tx.entry.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
          });

          const top = orderedEntries.slice(0, maxWinners);
          const topIds = top.map((e) => e.id);

          if (topIds.length > 0) {
            await tx.entry.updateMany({
              where: { postId, id: { in: topIds } },
              data: { isWinner: true },
            });
          }

          const nonTopIds = orderedEntries
            .filter((e) => !topIds.includes(e.id))
            .map((e) => e.id);

          if (nonTopIds.length > 0) {
            await tx.entry.updateMany({
              where: { postId, id: { in: nonTopIds } },
              data: { isWinner: false },
            });
          }

          await tx.postWinner.createMany({
            data: top.map((e) => ({
              postId,
              userId: e.userId,
              assignedBy: post.userId,
            })),
            skipDuplicates: true,
          });

          newlyWinning = top
            .map((e) => e.userId)
            .filter((uid) => !priorWinnerUserIds.has(uid));

          await notifyGiveawayWins(tx, newlyWinning, post.title, postId);

          if (orderedEntries.length >= maxWinners) {
            await tx.post.update({
              where: { id: postId },
              data: { status: 'completed' },
            });
          }
        }

        return { newEntry, newlyWinning };
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      });
      createdEntry = txResult.newEntry;
      newlyWinningUserIds = txResult.newlyWinning;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return apiError('You have already entered this giveaway', 400);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        return apiError('Could not submit entry, please try again', 409);
      }
      const httpStatus = (error as { httpStatus?: number }).httpStatus;
      if (typeof httpStatus === 'number' && error instanceof Error) {
        return apiError(error.message, httpStatus);
      }
      throw error;
    }

    checkAndAwardBadges(user.id).catch(console.error);
    for (const uid of newlyWinningUserIds) {
      checkAndAwardBadges(uid).catch(console.error);
    }

    return apiSuccess(createdEntry, 'Entry created successfully', 201);
  } catch (error) {
    console.error('Error creating entry:', error);
    return apiError('Failed to create entry', 500);
  }
}

/**
 * GET /api/posts/[id]/entries
 * Get all entries for a post with pagination
 */
export async function GET (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return apiError('Invalid pagination parameters', 400);
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return apiError('Post not found', 404);
    }

    // Get entries with pagination
    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              walletAddress: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.entry.count({ where: { postId } }),
    ]);

    return apiSuccess(
      {
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      undefined,
      200,
    );
  } catch (error) {
    console.error('Error fetching entries:', error);
    return apiError('Failed to fetch entries', 500);
  }
}

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export const XP_REWARDS = {
  createGiveawayPost: 50,
  enterGiveaway: 10,
  winGiveaway: 100,
  createHelpRequest: 20,
  contributeToHelpRequest: 30,
  receiveContribution: 15,
  receiveTenLikes: 25,
} as const;

export type XpReason =
  | 'giveaway_post_created'
  | 'giveaway_entered'
  | 'giveaway_won'
  | 'help_request_created'
  | 'help_request_contributed'
  | 'help_request_received_contribution'
  | 'post_received_10_likes';

type PrismaDbClient = typeof prisma | Prisma.TransactionClient;

type AwardXpOptions = {
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
};

type AwardXpResult = {
  awarded: boolean;
  amount: number;
  reason: XpReason;
  xp: number | null;
  rankId: string | null;
};

const XP_ANALYTICS_EVENT_TYPE = 'xp_awarded';

async function getRankIdForXp(db: PrismaDbClient, xp: number) {
  const rank = await db.rank.findFirst({
    where: {
      minPoints: { lte: xp },
      maxPoints: { gte: xp },
    },
    orderBy: {
      level: 'desc',
    },
    select: {
      id: true,
    },
  });

  return rank?.id ?? null;
}

async function alreadyAwarded(
  db: PrismaDbClient,
  userId: string,
  dedupeKey: string,
) {
  const existingEvent = await db.analyticsEvent.findFirst({
    where: {
      userId,
      eventType: XP_ANALYTICS_EVENT_TYPE,
      eventData: {
        path: ['dedupeKey'],
        equals: dedupeKey,
      },
    } as any,
    select: {
      id: true,
    },
  } as any);

  return Boolean(existingEvent);
}

async function awardXpInDb(
  db: PrismaDbClient,
  userId: string,
  amount: number,
  reason: XpReason,
  options: AwardXpOptions,
): Promise<AwardXpResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('XP amount must be greater than zero');
  }

  if (options.dedupeKey && await alreadyAwarded(db, userId, options.dedupeKey)) {
    return {
      awarded: false,
      amount: 0,
      reason,
      xp: null,
      rankId: null,
    };
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      xp: {
        increment: amount,
      },
    },
    select: {
      xp: true,
      rankId: true,
    },
  });

  const nextRankId = await getRankIdForXp(db, updatedUser.xp);
  const finalUser = nextRankId !== updatedUser.rankId
    ? await db.user.update({
      where: { id: userId },
      data: {
        rankId: nextRankId,
      },
      select: {
        xp: true,
        rankId: true,
      },
    })
    : updatedUser;

  await db.analyticsEvent.create({
    data: {
      userId,
      eventType: XP_ANALYTICS_EVENT_TYPE,
      eventData: {
        reason,
        amount,
        xp: finalUser.xp,
        rankId: finalUser.rankId,
        dedupeKey: options.dedupeKey ?? null,
        metadata: options.metadata ?? null,
      },
    },
  } as any);

  return {
    awarded: true,
    amount,
    reason,
    xp: finalUser.xp,
    rankId: finalUser.rankId,
  };
}

export async function awardXp(
  userId: string,
  amount: number,
  reason: XpReason,
  options: AwardXpOptions = {},
  db: PrismaDbClient = prisma,
) {
  if (db === prisma) {
    return prisma.$transaction((tx) => awardXpInDb(tx, userId, amount, reason, options));
  }

  return awardXpInDb(db, userId, amount, reason, options);
}

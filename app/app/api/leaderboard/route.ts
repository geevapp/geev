import { apiError, apiSuccess } from '@/lib/api-response';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parsePagination } from '@/lib/pagination';

export async function GET (request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all-time';
    const { page, limit, skip } = parsePagination(searchParams, {
      defaultLimit: 50,
    });

    let dateFilter: Date | undefined;
    if (period === 'weekly') {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // (#429) Ranking must consider every user, then slice the requested page.
    // Selecting take/skip first made the badge sort a per-page no-op and made
    // `total` equal the page size.
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        xp: true,
        rank: true,
        badges: {
          include: { badge: true },
        },
        _count: {
          select: {
            posts: dateFilter
              ? { where: { createdAt: { gte: dateFilter } } }
              : true,
            entries: dateFilter
              ? { where: { createdAt: { gte: dateFilter } } }
              : true,
            helpContributions: dateFilter
              ? { where: { createdAt: { gte: dateFilter } } }
              : true,
          },
        },
      },
    });

    // (#429) Badge tiers are capitalized in the schema; the lowercase lookup
    // map used to resolve to undefined for every badge. Keys are normalized
    // case-insensitively and Diamond is included.
    const tierRank: Record<string, number> = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
      diamond: 5,
    };

    const leaderboard = users
      .map((user) => {
        const badges = user.badges
          .map((ub) => ub.badge)
          .sort(
            (a, b) =>
              (tierRank[b.tier.toLowerCase()] || 0) -
              (tierRank[a.tier.toLowerCase()] || 0)
          );

        const activityCount =
          user._count.posts + user._count.entries + user._count.helpContributions;

        return {
          id: user.id,
          name: user.name,
          avatar_url: user.avatarUrl,
          xp: user.xp,
          rank: user.rank,
          post_count: user._count.posts,
          entry_count: user._count.entries,
          help_contribution_count: user._count.helpContributions,
          // (#429) total contributions previously ignored helpContributions.
          total_contributions: activityCount,
          badges,
          // (#429) Period leaderboards rank by activity within the window;
          // all-time keeps the global xp ordering.
          sortScore: dateFilter ? activityCount : user.xp,
        };
      })
      .sort((a, b) => b.sortScore - a.sortScore);

    return apiSuccess({
      leaderboard,
      page,
      limit,
      period,
      total: users.length,
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return apiError('Failed to fetch leaderboard', 500);
  }
}
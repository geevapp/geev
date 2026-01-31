import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all-time';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return apiError('Invalid pagination parameters', 400);
    }

    let dateFilter: Date | undefined;
    if (period === 'weekly') {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        xp: true,
        _count: {
          select: {
            posts: dateFilter
              ? { where: { createdAt: { gte: dateFilter } } }
              : true,
            entries: dateFilter
              ? { where: { createdAt: { gte: dateFilter } } }
              : true,
          },
        },
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Get user badges and calculate contributions
    const leaderboard = await Promise.all(
      users.map(async (user) => {
        const userBadges = await prisma.userBadge.findMany({
          where: { userId: user.id },
          include: { badge: true },
        });
        
        const badges = userBadges.map(ub => ub.badge).sort((a, b) => {
          const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
          return (tierOrder[b.tier as keyof typeof tierOrder] || 0) - (tierOrder[a.tier as keyof typeof tierOrder] || 0);
        });

        return {
          id: user.id,
          name: user.name,
          avatar_url: user.avatarUrl,
          xp: user.xp,
          post_count: user._count.posts,
          entry_count: user._count.entries,
          total_contributions: user._count.posts + user._count.entries,
          badges,
        };
      }),
    );

    // Sort by total contributions
    leaderboard.sort((a, b) => b.total_contributions - a.total_contributions);

    return apiSuccess({
      leaderboard,
      page,
      limit,
      period,
      total: leaderboard.length,
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return apiError('Failed to fetch leaderboard', 500);
  }
}
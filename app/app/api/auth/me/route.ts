import { apiError, apiSuccess } from '@/lib/api-response';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET () {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return apiError('Unauthorized', 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                badges: {
                    include: {
                        badge: true,
                    },
                },
                rank: true,
                _count: {
                    select: {
                        posts: true,
                        entries: true,
                        comments: true,
                        interactions: true,
                        badges: true,
                        analyticsEvents: true,
                        followings: true,
                        followers: true,
                        helpContributions: true,
                        accounts: true,
                        sessions: true,
                    },
                },
            },
        });

        if (!user) {
            return apiError('User not found', 404);
        }

        const normalizedUser = {
            ...user,
            rank:
                user.rank ??
                ({
                    id: 'newcomer',
                    level: 1,
                    title: 'Newcomer',
                    color: 'text-gray-500',
                    minPoints: 0,
                    maxPoints: 199,
                } as const),
            badges: user.badges.map((userBadge) => ({
                ...userBadge.badge,
                awardedAt: userBadge.awardedAt,
            })),
        };

        return apiSuccess(normalizedUser, 'OK', 200);
    } catch (error) {
        return apiError('Failed to fetch current user', 500);
    }
}

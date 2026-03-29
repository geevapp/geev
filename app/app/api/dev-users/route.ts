import { apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

export async function GET () {
    if (process.env.NODE_ENV !== 'development') {
        return apiSuccess([], 'OK', 200);
    }

    const users = await prisma.user.findMany({
        include: {
            badges: true,
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

    return apiSuccess(users, 'OK', 200);
}

import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) return apiError('Unauthorized', 401);

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            prisma.walletTransaction.findMany({
                where: { userId: currentUser.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.walletTransaction.count({ where: { userId: currentUser.id } }),
        ]);

        return apiSuccess({ transactions, total, page, limit });
    } catch {
        return apiError('Failed to fetch transactions', 500);
    }
}

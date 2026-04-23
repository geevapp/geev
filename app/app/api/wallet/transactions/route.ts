import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/wallet/transactions
 *
 * Returns paginated transaction history with lastSync metadata so clients can
 * implement interval/focus-based refresh without polling blindly.
 *
 * Query params:
 *   page   — 1-based page number (default 1)
 *   limit  — items per page, capped at 50 (default 20)
 */
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) return apiError('Unauthorized', 401);

        const { searchParams } = new URL(request.url);
        const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
        const skip  = (page - 1) * limit;

        const [transactions, total, user] = await Promise.all([
            prisma.walletTransaction.findMany({
                where:   { userId: currentUser.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.walletTransaction.count({ where: { userId: currentUser.id } }),
            prisma.user.findUnique({
                where:  { id: currentUser.id },
                select: { updatedAt: true },
            }),
        ]);

        return apiSuccess({
            transactions,
            total,
            page,
            limit,
            // lastSync tells the client when the server last reconciled state — use
            // this timestamp to decide whether a refresh (interval or on-focus) is needed.
            lastSync: user?.updatedAt.toISOString() ?? new Date().toISOString(),
        });
    } catch {
        return apiError('Failed to fetch transactions', 500);
    }
}

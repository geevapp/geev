import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/wallet/balance
 *
 * Returns a normalized wallet snapshot:
 *   - balance      : local ledger balance (always available)
 *   - assets       : Stellar asset breakdown (populated when simulated=false and on-chain sync is live)
 *   - transactions : most recent 5 transactions for quick client preview
 *   - lastSync     : ISO timestamp of the last balance reconciliation
 *   - simulated    : true when operating against the local ledger only
 *
 * Query params:
 *   simulated=true (default) — return local balance only
 *   simulated=false          — placeholder for future on-chain Stellar fetch
 */
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) return apiError('Unauthorized', 401);

        const { searchParams } = new URL(request.url);
        const simulated = searchParams.get('simulated') !== 'false';

        const [user, recentTransactions] = await Promise.all([
            prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { walletBalance: true, updatedAt: true },
            }),
            prisma.walletTransaction.findMany({
                where: { userId: currentUser.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
        ]);

        if (!user) return apiError('User not found', 404);

        return apiSuccess({
            balance: user.walletBalance,
            assets: simulated
                ? []
                : [
                      // Placeholder — replace with StellarService.getAssetBalances() when live
                      { code: 'XLM', issuer: null, balance: user.walletBalance },
                  ],
            transactions: recentTransactions,
            lastSync: user.updatedAt.toISOString(),
            simulated,
        });
    } catch {
        return apiError('Failed to fetch wallet balance', 500);
    }
}

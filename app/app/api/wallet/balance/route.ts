import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) return apiError('Unauthorized', 401);

        return apiSuccess({ balance: currentUser.walletBalance });
    } catch {
        return apiError('Failed to fetch wallet balance', 500);
    }
}

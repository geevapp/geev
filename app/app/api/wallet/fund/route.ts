import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readJsonBody } from '@/lib/parse-json-body';

const fundSchema = z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    method: z.enum(['card', 'bank', 'crypto']).default('card'),
    note: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) return apiError('Unauthorized', 401);

        const raw = await readJsonBody(request);
        if (!raw.ok) return raw.response;
        const parsed = fundSchema.safeParse(raw.data);
        if (!parsed.success) {
            return apiError(parsed.error.errors[0].message, 400);
        }

        const { amount, method, note } = parsed.data;

        const [transaction, updatedUser] = await prisma.$transaction([
            prisma.walletTransaction.create({
                data: {
                    userId: currentUser.id,
                    type: 'fund',
                    amount,
                    currency: 'USD',
                    status: 'completed',
                    method,
                    note: note ?? null,
                },
            }),
            prisma.user.update({
                where: { id: currentUser.id },
                data: { walletBalance: { increment: amount } },
                select: { walletBalance: true },
            }),
        ]);

        return apiSuccess(
            { balance: updatedUser.walletBalance, transaction },
            'Wallet funded successfully',
            201,
        );
    } catch {
        return apiError('Failed to fund wallet', 500);
    }
}

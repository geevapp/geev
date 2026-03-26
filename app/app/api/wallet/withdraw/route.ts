import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readJsonBody } from '@/lib/parse-json-body';

const withdrawSchema = z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    method: z.enum(['bank', 'crypto', 'card']).default('bank'),
    note: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) return apiError('Unauthorized', 401);

        const raw = await readJsonBody(request);
        if (!raw.ok) return raw.response;
        const parsed = withdrawSchema.safeParse(raw.data);
        if (!parsed.success) {
            return apiError(parsed.error.errors[0].message, 400);
        }

        const { amount, method, note } = parsed.data;

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: currentUser.id },
                select: { walletBalance: true },
            });

            if (!user) throw new Error('USER_NOT_FOUND');
            if (user.walletBalance < amount) throw new Error('INSUFFICIENT_BALANCE');

            const transaction = await tx.walletTransaction.create({
                data: {
                    userId: currentUser.id,
                    type: 'withdraw',
                    amount,
                    currency: 'USD',
                    status: 'pending',
                    method,
                    note: note ?? null,
                },
            });

            const updatedUser = await tx.user.update({
                where: { id: currentUser.id },
                data: { walletBalance: { decrement: amount } },
                select: { walletBalance: true },
            });

            return { transaction, balance: updatedUser.walletBalance };
        });

        return apiSuccess(result, 'Withdrawal initiated successfully');
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'INSUFFICIENT_BALANCE') {
                return apiError('Insufficient wallet balance', 400);
            }
            if (error.message === 'USER_NOT_FOUND') {
                return apiError('User not found', 404);
            }
        }
        return apiError('Failed to process withdrawal', 500);
    }
}

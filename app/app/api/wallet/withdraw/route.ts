import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/parse-json-body";
import { submitStellarWithdrawal } from "@/lib/stellar";

const withdrawSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  method: z.enum(["bank", "crypto", "card"]).default("bank"),
  note: z.string().optional(),
  /**
   * simulated=true  (default) — mutate local ledger only.
   * simulated=false           — reserved for future on-chain Stellar withdrawal.
   */
  simulated: z.boolean().default(true),
  destinationAddress: z.string().optional(),
  asset: z.string().default("XLM"),
});

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return apiError("Unauthorized", 401);

    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;
    const parsed = withdrawSchema.safeParse(raw.data);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { amount, method, note, simulated } = parsed.data;

    if (!simulated) {
      const { destinationAddress, asset } = parsed.data;

      if (!destinationAddress)
        return apiError(
          "destinationAddress is required for on-chain withdrawal",
          400,
        );

      // Optimistic balance check before hitting the chain
      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { walletBalance: true, walletAddress: true },
      });
      if (!user) return apiError("User not found", 404);
      if (user.walletBalance < amount)
        return apiError("Insufficient wallet balance", 400);

      // Reserve the balance atomically before submitting, then create the pending transaction.
      const reservation = await prisma.$transaction(async (tx) => {
        const reservationResult = await tx.user.updateMany({
          where: {
            id: currentUser.id,
            walletBalance: { gte: amount },
          },
          data: {
            walletBalance: { decrement: amount },
          },
        });

        if (reservationResult.count === 0) return null;

        const pendingTx = await tx.walletTransaction.create({
          data: {
            userId: currentUser.id,
            type: "withdraw",
            amount,
            currency: asset,
            status: "pending",
            method,
            note: note ?? null,
            stellarAddress: destinationAddress,
          },
        });

        const updatedUser = await tx.user.findUnique({
          where: { id: currentUser.id },
          select: { walletBalance: true, updatedAt: true },
        });

        return { pendingTx, updatedUser };
      });

      if (!reservation) {
        return apiError("Insufficient wallet balance", 400);
      }

      const { pendingTx, updatedUser } = reservation;
      let txHash: string;
      try {
        txHash = await submitStellarWithdrawal({
          sourceAddress: user.walletAddress,
          destinationAddress,
          amount,
          asset,
        });
      } catch (err) {
        await prisma.$transaction([
          prisma.walletTransaction.update({
            where: { id: pendingTx.id },
            data: { status: "failed" },
          }),
          prisma.user.update({
            where: { id: currentUser.id },
            data: { walletBalance: { increment: amount } },
          }),
        ]);

        return apiError(
          err instanceof Error ? err.message : "Stellar submission failed",
          502,
        );
      }

      const completedTx = await prisma.walletTransaction.update({
        where: { id: pendingTx.id },
        data: { status: "completed", txHash },
      });

      return apiSuccess(
        {
          balance: updatedUser.walletBalance,
          transaction: completedTx,
          lastSync: updatedUser.updatedAt.toISOString(),
          simulated: false,
          txHash,
        },
        "Withdrawal completed successfully",
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: currentUser.id },
        select: { walletBalance: true },
      });

      if (!user) throw new Error("USER_NOT_FOUND");
      if (user.walletBalance < amount) throw new Error("INSUFFICIENT_BALANCE");

      const transaction = await tx.walletTransaction.create({
        data: {
          userId: currentUser.id,
          type: "withdraw",
          amount,
          currency: "USD",
          status: "pending",
          method,
          note: note ?? null,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: currentUser.id },
        data: { walletBalance: { decrement: amount } },
        select: { walletBalance: true, updatedAt: true },
      });

      return {
        transaction,
        balance: updatedUser.walletBalance,
        updatedAt: updatedUser.updatedAt,
      };
    });

    return apiSuccess(
      {
        balance: result.balance,
        transaction: result.transaction,
        lastSync: result.updatedAt.toISOString(),
        simulated,
      },
      "Withdrawal initiated successfully",
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT_BALANCE")
        return apiError("Insufficient wallet balance", 400);
      if (error.message === "USER_NOT_FOUND")
        return apiError("User not found", 404);
    }
    return apiError("Failed to process withdrawal", 500);
  }
}

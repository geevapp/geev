import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/parse-json-body";
import { submitStellarWithdrawal, convertUSDtoXLM } from "@/lib/stellar";

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

      // Convert USD to XLM for on-chain submission
      let xlmAmount = amount;
      if (asset === "XLM") {
        try {
          xlmAmount = await convertUSDtoXLM(amount);
          
          // Validate that converted amount is a valid number
          if (!Number.isFinite(xlmAmount) || xlmAmount <= 0) {
            console.error(`Invalid converted XLM amount: ${xlmAmount} from USD ${amount}`);
            return apiError(
              "Conversion resulted in invalid amount",
              502,
            );
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`USD to XLM conversion failed: ${errorMsg}`, {
            usdAmount: amount,
            error: err,
          });
          return apiError(
            `Failed to convert USD to XLM: ${errorMsg}`,
            502,
          );
        }
      }

      // Create a pending record before submitting (idempotency anchor)
      const pendingTx = await prisma.walletTransaction.create({
        data: {
          userId: currentUser.id,
          type: "withdraw",
          amount,
          convertedAmount: xlmAmount,
          currency: "USD",
          convertedCurrency: asset,
          status: "pending",
          method,
          note: note ?? null,
          stellarAddress: destinationAddress,
        },
      });

      let txHash: string;
      try {
        // Validate parameters before submission
        if (!user.walletAddress) {
          throw new Error("User wallet address not configured");
        }
        if (!Number.isFinite(xlmAmount) || xlmAmount <= 0) {
          throw new Error(`Invalid XLM amount for submission: ${xlmAmount}`);
        }

        txHash = await submitStellarWithdrawal({
          sourceAddress: user.walletAddress,
          destinationAddress,
          amount: xlmAmount,
          asset,
        });
      } catch (err) {
        // Mark the pending record as failed — do NOT touch balance
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`Stellar submission failed: ${errorMsg}`, { error: err });
        
        await prisma.walletTransaction.update({
          where: { id: pendingTx.id },
          data: { status: "failed" },
        });
        return apiError(
          `Stellar submission failed: ${errorMsg}`,
          502,
        );
      }

      // Settle: mark completed and decrement balance atomically
      const [completedTx, updatedUser] = await prisma.$transaction([
        prisma.walletTransaction.update({
          where: { id: pendingTx.id },
          data: { status: "completed", txHash },
        }),
        prisma.user.update({
          where: { id: currentUser.id },
          data: { walletBalance: { decrement: amount } },
          select: { walletBalance: true, updatedAt: true },
        }),
      ]);

      return apiSuccess(
        {
          balance: updatedUser.walletBalance,
          transaction: completedTx,
          lastSync: updatedUser.updatedAt.toISOString(),
          simulated: false,
          txHash,
          conversionInfo: {
            originalAmount: amount,
            originalCurrency: "USD",
            convertedAmount: xlmAmount,
            convertedCurrency: asset,
            rate: (xlmAmount / amount).toFixed(7),
          },
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

      // For simulated withdrawals, still calculate what XLM amount would be
      // This helps with testing and audit trail
      let xlmAmount = amount;
      try {
        xlmAmount = await convertUSDtoXLM(amount);
        
        // Validate the converted amount
        if (!Number.isFinite(xlmAmount) || xlmAmount <= 0) {
          console.warn(`Invalid simulated conversion result: ${xlmAmount} from USD ${amount}, using fallback`);
          xlmAmount = amount;
        }
      } catch (err) {
        // If conversion fails, fallback to 1:1 (for testing)
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`Simulated withdrawal conversion failed, using fallback: ${errorMsg}`);
        xlmAmount = amount;
      }

      const transaction = await tx.walletTransaction.create({
        data: {
          userId: currentUser.id,
          type: "withdraw",
          amount,
          convertedAmount: xlmAmount,
          currency: "USD",
          convertedCurrency: "XLM",
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
        conversionInfo: {
          originalAmount: amount,
          originalCurrency: "USD",
          convertedAmount: result.transaction.convertedAmount,
          convertedCurrency: "XLM",
          rate: (result.transaction.convertedAmount / amount).toFixed(7),
        },
      },
      "Withdrawal initiated successfully",
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Withdrawal POST handler error: ${errorMsg}`, { error });
    
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT_BALANCE")
        return apiError("Insufficient wallet balance", 400);
      if (error.message === "USER_NOT_FOUND")
        return apiError("User not found", 404);
    }
    return apiError(`Failed to process withdrawal: ${errorMsg}`, 500);
  }
}

import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLiveTransactions } from "@/lib/stellar";
import { parsePaginationParam } from "@/lib/validation";

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
    if (!currentUser) return apiError("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const page = parsePaginationParam(searchParams.get("page"), {
      defaultValue: 1,
      min: 1,
    });
    const limit = parsePaginationParam(searchParams.get("limit"), {
      defaultValue: 20,
      min: 1,
      max: 50,
    });
    const skip = (page - 1) * limit;

    const [transactions, total, user] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: { userId: currentUser.id } }),
      prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { updatedAt: true },
      }),
    ]);

    const simulated = searchParams.get("simulated") !== "false";

    let chainTransactions: unknown[] = [];
    if (!simulated && currentUser.walletAddress) {
      chainTransactions = await getLiveTransactions(
        currentUser.walletAddress,
      ).catch(() => []);
    }

    return apiSuccess({
      transactions, // local ledger (always present)
      chainTransactions, // on-chain records (non-simulated only)
      total,
      page,
      limit,
      lastSync: user?.updatedAt.toISOString() ?? new Date().toISOString(),
      simulated,
    });
  } catch {
    return apiError("Failed to fetch transactions", 500);
  }
}

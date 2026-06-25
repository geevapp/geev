import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as withdraw } from "@/app/api/wallet/withdraw/route";

const mockGetCurrentUser = vi.hoisted(() => vi.fn());
const mockSubmitStellarWithdrawal = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => {
  const prisma = {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    walletTransaction: {
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  prisma.$transaction.mockImplementation(async (callback: any) => callback(prisma));

  return prisma;
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/stellar", () => ({
  submitStellarWithdrawal: mockSubmitStellarWithdrawal,
}));

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/wallet/withdraw", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("Wallet Withdrawal API (Unit)", () => {
  const mockUser = {
    id: "user-1",
    walletAddress: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  };
  let walletBalance = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    walletBalance = 100;

    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback);
      }
      return callback(mockPrisma);
    });

    mockPrisma.user.findUnique.mockImplementation(async () => ({
      walletBalance,
      walletAddress: mockUser.walletAddress,
      updatedAt: new Date(),
    }));

    mockPrisma.user.updateMany.mockImplementation(async ({
      where,
      data,
    }: any) => {
      const decrement = data?.walletBalance?.decrement ?? 0;
      if (walletBalance >= decrement) {
        walletBalance -= decrement;
        return { count: 1 };
      }
      return { count: 0 };
    });

    mockPrisma.user.update.mockImplementation(async ({ data }: any) => {
      const increment = data?.walletBalance?.increment ?? 0;
      if (increment) walletBalance += increment;
      return { walletBalance };
    });

    mockPrisma.walletTransaction.create.mockImplementation(async ({ data }: any) => ({
      id: `tx-${Math.random().toString(36).slice(2)}`,
      ...data,
    }));

    mockPrisma.walletTransaction.update.mockImplementation(async ({ where, data }: any) => ({
      id: where.id,
      ...data,
    }));

    mockSubmitStellarWithdrawal.mockResolvedValue("stubbed-tx-hash");
  });

  it("reserves balance atomically so only one of two simultaneous withdrawals succeeds", async () => {
    const body = {
      amount: 60,
      method: "bank",
      note: "Test withdrawal",
      simulated: false,
      destinationAddress:
        "GDESTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      asset: "XLM",
    };

    const requestA = createRequest(body);
    const requestB = createRequest(body);

    const [responseA, responseB] = await Promise.all([
      withdraw(requestA as any),
      withdraw(requestB as any),
    ]);

    expect(mockPrisma.user.updateMany).toHaveBeenCalledTimes(2);
    expect(mockPrisma.walletTransaction.create).toHaveBeenCalledTimes(1);
    expect(mockSubmitStellarWithdrawal).toHaveBeenCalledTimes(1);

    const statuses = [responseA.status, responseB.status].sort();
    expect(statuses).toEqual([200, 400]);

    const successResponse = responseA.status === 200 ? responseA : responseB;
    const failedResponse = responseA.status === 400 ? responseA : responseB;
    const successBody = await successResponse.json();
    const failedBody = await failedResponse.json();

    expect(successBody.success).toBe(true);
    expect(successBody.data.balance).toBe(40);
    expect(failedBody.error).toBe("Insufficient wallet balance");
    expect(walletBalance).toBe(40);
  });

  it("refunds reserved balance when the Stellar submission fails", async () => {
    mockSubmitStellarWithdrawal.mockRejectedValue(new Error("Horizon unavailable"));

    const request = createRequest({
      amount: 60,
      method: "bank",
      note: "Test failure refund",
      simulated: false,
      destinationAddress:
        "GDESTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      asset: "XLM",
    });

    const response = await withdraw(request as any);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("Horizon unavailable");
    expect(mockPrisma.walletTransaction.update).toHaveBeenCalledWith({
      where: expect.objectContaining({}),
      data: { status: "failed" },
    });
    expect(walletBalance).toBe(100);
  });
});

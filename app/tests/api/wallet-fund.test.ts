import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, parseResponse } from "../helpers/api";

const mockGetCurrentUser = vi.hoisted(() => vi.fn());
const mockReadJsonBody = vi.hoisted(() => vi.fn());
const mockVerifyStellarPayment = vi.hoisted(() => vi.fn());
const mockPrismaTransaction = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => ({
  $transaction: mockPrismaTransaction,
  walletTransaction: {
    create: vi.fn(),
  },
  user: {
    update: vi.fn(),
  },
}));

const mockPrismaKnownRequestError = vi.hoisted(() => {
  class PrismaClientKnownRequestError extends Error {
    code: string;

    constructor(message: string, code: string) {
      super(message);
      this.name = "PrismaClientKnownRequestError";
      this.code = code;
    }
  }

  return { PrismaClientKnownRequestError };
});

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/parse-json-body", () => ({
  readJsonBody: mockReadJsonBody,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/stellar", () => ({
  verifyStellarPayment: mockVerifyStellarPayment,
}));

vi.mock("@prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: mockPrismaKnownRequestError.PrismaClientKnownRequestError,
  },
}));

import { POST } from "@/app/api/wallet/fund/route";

describe("POST /api/wallet/fund", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STELLAR_DEPOSIT_ADDRESS = "GDUMMY_DEPOSIT";
    mockGetCurrentUser.mockResolvedValue({
      id: "user_1",
      walletAddress: "GUSER_WALLET",
    });
  });

  it("rejects a double-submitted transaction hash", async () => {
    mockReadJsonBody.mockResolvedValue({
      ok: true,
      data: {
        amount: 25,
        method: "crypto",
        simulated: false,
        txHash: "txhash-123",
        stellarAddress: "GDUMMY_DEPOSIT",
      },
    });
    mockVerifyStellarPayment.mockResolvedValue({ amount: 25, asset: "XLM" });
    mockPrismaTransaction.mockRejectedValueOnce(
      new mockPrismaKnownRequestError.PrismaClientKnownRequestError(
        "Unique constraint failed",
        "P2002",
      ),
    );

    const req = createMockRequest("http://localhost:3000/api/wallet/fund", {
      method: "POST",
      body: {
        amount: 25,
        method: "crypto",
        simulated: false,
        txHash: "txhash-123",
        stellarAddress: "GDUMMY_DEPOSIT",
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Transaction hash already processed");
  });

  it("rejects funding for a different user's deposit address", async () => {
    mockReadJsonBody.mockResolvedValue({
      ok: true,
      data: {
        amount: 25,
        method: "crypto",
        simulated: false,
        txHash: "txhash-456",
        stellarAddress: "GOTHER_WALLET",
      },
    });

    const req = createMockRequest("http://localhost:3000/api/wallet/fund", {
      method: "POST",
      body: {
        amount: 25,
        method: "crypto",
        simulated: false,
        txHash: "txhash-456",
        stellarAddress: "GOTHER_WALLET",
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Deposits must be sent to the configured custodial address");
    expect(mockVerifyStellarPayment).not.toHaveBeenCalled();
  });
});

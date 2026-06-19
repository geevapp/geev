import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUsedChallenge = vi.hoisted(() => vi.fn());
const mockCreateUsedChallenge = vi.hoisted(() => vi.fn());
const mockFindUser = vi.hoisted(() => vi.fn());
const mockCreateUser = vi.hoisted(() => vi.fn());
const mockVerifyChallenge = vi.hoisted(() => vi.fn());
const mockFromXDR = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    usedChallenge: {
      findUnique: mockFindUsedChallenge,
      create: mockCreateUsedChallenge,
    },
    user: {
      findUnique: mockFindUser,
      create: mockCreateUser,
    },
  },
}));

vi.mock("@/lib/sep10", () => ({
  verifyChallenge: mockVerifyChallenge,
}));

vi.mock("@/lib/stellar", () => ({
  getNetworkPassphrase: () => "Public Global Stellar Network ; September 2015",
}));

vi.mock("@stellar/stellar-sdk", () => ({
  Networks: {
    PUBLIC: "Public Global Stellar Network ; September 2015",
  },
  TransactionBuilder: {
    fromXDR: mockFromXDR,
  },
}));

describe("authenticateWalletWithChallenge", () => {
  const walletAddress =
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

  beforeEach(() => {
    vi.clearAllMocks();
    mockFromXDR.mockReturnValue({
      hash: () => Buffer.from("challenge-hash"),
    });
  });

  it("blocks replayed challenge transactions", async () => {
    mockFindUsedChallenge.mockResolvedValue({ id: "used_1" });

    const { authenticateWalletWithChallenge } = await import("@/lib/wallet-auth");
    const result = await authenticateWalletWithChallenge({
      walletAddress,
      transaction: "signed-xdr",
    });

    expect(result).toEqual({
      success: false,
      status: 403,
      error: "Replay attack detected",
      message:
        "This signature has already been used. Please request a new challenge.",
    });
    expect(mockVerifyChallenge).not.toHaveBeenCalled();
  });

  it("creates a new user only after a valid challenge verification", async () => {
    mockFindUsedChallenge.mockResolvedValue(null);
    mockVerifyChallenge.mockReturnValue({ valid: true });
    mockFindUser
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockCreateUser.mockResolvedValue({
      id: "user_1",
      walletAddress,
      username: "alice",
      name: "alice",
      email: "alice@example.com",
      avatarUrl: null,
      bio: null,
      xp: 0,
      walletBalance: 0,
      createdAt: new Date(),
    });

    const { authenticateWalletWithChallenge } = await import("@/lib/wallet-auth");
    const result = await authenticateWalletWithChallenge({
      walletAddress,
      transaction: "signed-xdr",
      username: "alice",
      email: "alice@example.com",
    });

    expect(mockCreateUsedChallenge).toHaveBeenCalledTimes(1);
    expect(mockCreateUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        walletAddress,
        username: "alice",
        name: "alice",
        email: "alice@example.com",
      }),
    });
    expect(result).toMatchObject({
      success: true,
      user: {
        id: "user_1",
        walletAddress,
        username: "alice",
      },
    });
  });
});

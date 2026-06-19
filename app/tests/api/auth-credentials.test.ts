import { beforeEach, describe, expect, it, vi } from "vitest";

import { authConfig } from "@/lib/auth-config";

const mockAuthenticateWalletWithChallenge = vi.hoisted(() => vi.fn());

vi.mock("@/lib/wallet-auth", () => ({
  authenticateWalletWithChallenge: mockAuthenticateWalletWithChallenge,
}));

const VALID_WALLET_ADDRESS =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

describe("Auth Credentials Provider (authorize)", () => {
  let authorize: (credentials: Record<string, unknown>) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    authorize = (authConfig.providers[0] as any).options.authorize;
  });

  it("registers a user from a verified challenge transaction", async () => {
    mockAuthenticateWalletWithChallenge.mockResolvedValue({
      success: true,
      user: {
        id: "new_user_1",
        walletAddress: VALID_WALLET_ADDRESS,
        username: "alice",
        name: "alice",
        email: "alice@example.com",
        avatarUrl: null,
        bio: null,
        xp: 0,
        walletBalance: 0,
        createdAt: new Date(),
      },
    });

    const result = await authorize({
      walletAddress: VALID_WALLET_ADDRESS,
      transaction: "signed-xdr",
      username: "alice",
      email: "alice@example.com",
    });

    expect(result).toMatchObject({
      id: "new_user_1",
      walletAddress: VALID_WALLET_ADDRESS,
      username: "alice",
      email: "alice@example.com",
    });
    expect(mockAuthenticateWalletWithChallenge).toHaveBeenCalledWith({
      walletAddress: VALID_WALLET_ADDRESS,
      transaction: "signed-xdr",
      username: "alice",
      email: "alice@example.com",
    });
  });

  it("logs in an existing user from a verified challenge transaction", async () => {
    mockAuthenticateWalletWithChallenge.mockResolvedValue({
      success: true,
      user: {
        id: "user_existing",
        walletAddress: VALID_WALLET_ADDRESS,
        username: "bob",
        name: "Bob",
        email: "bob@example.com",
        avatarUrl: null,
        bio: "My bio",
        xp: 10,
        walletBalance: 0,
        createdAt: new Date(),
      },
    });

    const result = await authorize({
      walletAddress: VALID_WALLET_ADDRESS,
      transaction: "signed-xdr",
    });

    expect(result).toMatchObject({
      id: "user_existing",
      walletAddress: VALID_WALLET_ADDRESS,
      username: "bob",
      email: "bob@example.com",
    });
  });

  it("rejects legacy signature credentials", async () => {
    const result = await authorize({
      walletAddress: VALID_WALLET_ADDRESS,
      signature: "legacy-signature",
      message: "legacy-message",
    });

    expect(result).toBeNull();
    expect(mockAuthenticateWalletWithChallenge).not.toHaveBeenCalled();
  });

  it("returns null when secure verification fails", async () => {
    mockAuthenticateWalletWithChallenge.mockResolvedValue({
      success: false,
      status: 403,
      error: "Replay attack detected",
      message:
        "This signature has already been used. Please request a new challenge.",
    });

    const result = await authorize({
      walletAddress: VALID_WALLET_ADDRESS,
      transaction: "replayed-xdr",
    });

    expect(result).toBeNull();
  });
});

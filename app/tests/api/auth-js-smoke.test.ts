import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST as logout } from "@/app/(auth)/logout/route";
import { authConfig } from "@/lib/auth-config";

const mockAuthenticateWalletWithChallenge = vi.hoisted(() => vi.fn());

vi.mock("@/lib/wallet-auth", () => ({
  authenticateWalletWithChallenge: mockAuthenticateWalletWithChallenge,
}));

const VALID_WALLET_ADDRESS =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

describe("Auth.js JWT credentials smoke flow", () => {
  it("signs in through credentials without a database adapter session", async () => {
    expect(authConfig).not.toHaveProperty("adapter");
    expect(authConfig.session?.strategy).toBe("jwt");

    mockAuthenticateWalletWithChallenge.mockResolvedValue({
      success: true,
      user: {
        id: "user_1",
        walletAddress: VALID_WALLET_ADDRESS,
        username: "alice",
        name: "alice",
        email: "alice@example.com",
        avatarUrl: null,
        bio: null,
        createdAt: new Date("2026-06-19T00:00:00.000Z"),
      },
    });

    const authorize = (authConfig.providers[0] as any).options.authorize;
    const user = await authorize({
      walletAddress: VALID_WALLET_ADDRESS,
      transaction: "signed-xdr",
    });

    expect(user).toMatchObject({
      id: "user_1",
      walletAddress: VALID_WALLET_ADDRESS,
      username: "alice",
      email: "alice@example.com",
    });

    const token = await authConfig.callbacks?.jwt?.({
      token: {},
      user,
      account: null,
      profile: undefined,
      trigger: "signIn",
      isNewUser: false,
    } as any);

    const session = await authConfig.callbacks?.session?.({
      session: { user: {}, expires: new Date("2026-07-19T00:00:00.000Z").toISOString() },
      token,
      user,
      newSession: undefined,
      trigger: "update",
    } as any);

    expect(session?.user).toEqual({
      id: "user_1",
      walletAddress: VALID_WALLET_ADDRESS,
      username: "alice",
    });
  });

  it("signs out by clearing Auth.js JWT session cookies", async () => {
    const response = await logout(
      new NextRequest("http://localhost/api/auth/logout", { method: "POST" }),
    );
    const cookies = response.cookies.getAll();

    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "next-auth.session-token",
          value: "",
          maxAge: 0,
        }),
        expect.objectContaining({
          name: "__Secure-next-auth.session-token",
          value: "",
          maxAge: 0,
        }),
      ]),
    );
  });
});

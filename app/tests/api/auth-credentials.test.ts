/**
 * Unit tests for the NextAuth Credentials provider `authorize` function.
 *
 * The application has no separate /api/auth/login or /api/auth/register routes.
 * Both login and registration flow through the Credentials provider's `authorize`
 * callback in lib/auth-config.ts:
 *   - Registration: walletAddress + valid signature + username → creates new user
 *   - Login:        walletAddress + valid signature (no username) → returns existing user
 *
 * We follow the same prisma-stubbing pattern as entries.test.ts / posts.test.ts:
 * import the real prisma singleton and replace individual methods with vi.fn()
 * so that `auth-config.ts` (which captured the same singleton at import time)
 * calls our stubs instead of hitting a real database.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authConfig } from '@/lib/auth-config';
// Import the real prisma singleton — we will stub individual methods per test,
// exactly as entries.test.ts and posts.test.ts do.
import { prisma } from '@/lib/prisma';

const mockVerify = vi.hoisted(() => vi.fn());
const mockFromPublicKey = vi.hoisted(() => vi.fn());

vi.mock('@stellar/stellar-sdk', () => ({
  Keypair: {
    fromPublicKey: mockFromPublicKey,
  },
}));

// PrismaAdapter is invoked at module-evaluation time inside authConfig.
// Return a no-op object so importing auth-config doesn't attempt a real DB connection.
vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn().mockReturnValue({}),
}));


const VALID_WALLET_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const SECOND_VALID_WALLET_ADDRESS = 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const NONCE = 'abcdef1234567890';
const SIGN_MESSAGE = `Please sign this message to authenticate with Geev.\nNonce: ${NONCE}`;

describe('Auth Credentials Provider (authorize)', () => {
  // The Credentials provider is the first (and only) provider in authConfig.
  let authorize: (credentials: Record<string, unknown>) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFromPublicKey.mockReturnValue({ verify: mockVerify });
    (prisma as any).authNonce ??= {};
    (prisma as any).authNonce.findUnique = vi.fn().mockResolvedValue({
      nonce: NONCE,
      used: false,
      expiresAt: new Date(Date.now() + 60_000),
    });
    (prisma as any).authNonce.update = vi.fn().mockResolvedValue({
      nonce: NONCE,
      used: true,
      expiresAt: new Date(Date.now() + 60_000),
    });
    authorize = (authConfig.providers[0] as any).options.authorize;
  });

  // ────────────────────────────────────────────────────────────
  // Registration path
  // ────────────────────────────────────────────────────────────

  it('should register a new user when valid signature and username are provided', async () => {
    const walletAddress = VALID_WALLET_ADDRESS;
    const createdUser = {
      id: 'new_user_1',
      walletAddress,
      name: 'alice',
      username: 'alice',
      email: null,
      bio: null,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`,
      xp: 0,
      createdAt: new Date(),
    };

    mockVerify.mockReturnValue(true);
    prisma.user.findUnique = vi.fn().mockResolvedValue(null); // user does not exist yet
    prisma.user.create = vi.fn().mockResolvedValue(createdUser);

    const result = await authorize({
      walletAddress,
      signature: 'dmFsaWRzaWduYXR1cmU=',
      message: SIGN_MESSAGE,
      username: 'alice',
    });

    expect(result).not.toBeNull();
    expect((result as any).walletAddress).toBe(walletAddress);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          walletAddress,
          name: 'alice',
          username: 'alice',
          xp: 0,
        }),
      }),
    );
  });

  it('should register with an email when email is provided during registration', async () => {
    const walletAddress = SECOND_VALID_WALLET_ADDRESS;
    mockVerify.mockReturnValue(true);
    prisma.user.findUnique = vi.fn().mockResolvedValue(null);
    prisma.user.create = vi.fn().mockResolvedValue({
      id: 'new_user_email',
      walletAddress,
      name: 'eve',
      username: 'eve',
      email: 'eve@example.com',
      bio: null,
      avatarUrl: null,
      xp: 0,
      createdAt: new Date(),
    });

    const result = await authorize({
      walletAddress,
      signature: 'dmFsaWRzaWduYXR1cmU=',
      message: SIGN_MESSAGE,
      username: 'eve',
      email: 'eve@example.com',
    });

    expect(result).not.toBeNull();
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'eve@example.com' }),
      }),
    );
  });

  // ────────────────────────────────────────────────────────────
  // Login path
  // ────────────────────────────────────────────────────────────

  it('should return user on successful login with an existing account', async () => {
    const existingUser = {
      id: 'user_existing',
      walletAddress: VALID_WALLET_ADDRESS,
      name: 'Bob',
      username: 'bob',
      email: 'bob@example.com',
      bio: 'My bio',
      avatarUrl: null,
      createdAt: new Date(),
    };

    mockVerify.mockReturnValue(true);
    prisma.user.findUnique = vi.fn().mockResolvedValue(existingUser);
    prisma.user.create = vi.fn(); // should not be called

    const result = await authorize({
      walletAddress: VALID_WALLET_ADDRESS,
      signature: 'dmFsaWRzaWduYXR1cmU=',
      message: SIGN_MESSAGE,
      // no username → login, not registration
    });

    expect(result).not.toBeNull();
    expect((result as any).id).toBe('user_existing');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────
  // Failure paths
  // ────────────────────────────────────────────────────────────

  it('should return null when signature is invalid', async () => {
    mockFromPublicKey.mockReturnValue({ verify: vi.fn().mockReturnValue(false) });

    const result = await authorize({
      walletAddress: VALID_WALLET_ADDRESS,
      signature: 'bad-sig',
      message: SIGN_MESSAGE,
    });

    expect(result).toBeNull();
  });

  it('should return null on login when user does not exist and no username provided', async () => {
    mockVerify.mockReturnValue(true);
    prisma.user.findUnique = vi.fn().mockResolvedValue(null); // no such user

    const result = await authorize({
      walletAddress: SECOND_VALID_WALLET_ADDRESS,
      signature: 'dmFsaWRzaWduYXR1cmU=',
      message: SIGN_MESSAGE,
      // no username → attempted login, not registration
    });

    expect(result).toBeNull();
  });

  it('should return null when credentials object is missing required fields', async () => {
    const result = await authorize({
      walletAddress: '',
      signature: '',
      message: '',
    });

    expect(result).toBeNull();
  });

  it('should return null when Keypair.fromPublicKey throws (malformed wallet address)', async () => {
    mockFromPublicKey.mockImplementation(() => {
      throw new Error('Invalid Stellar public key');
    });

    const result = await authorize({
      walletAddress: 'NOT_A_STELLAR_KEY',
      signature: 'some-sig',
      message: 'sign-this',
    });

    expect(result).toBeNull();
  });
});

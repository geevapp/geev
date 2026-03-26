/**
 * Unit tests for the NextAuth Credentials provider `authorize` function.
 *
 * The application has no separate /api/auth/login or /api/auth/register routes.
 * Both login and registration flow through the Credentials provider's `authorize`
 * callback in lib/auth-config.ts:
 *   - Registration: walletAddress + valid signature + username → creates new user
 *   - Login:        walletAddress + valid signature (no username) → returns existing user
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockVerify = vi.hoisted(() => vi.fn());
const mockFromPublicKey = vi.hoisted(() => vi.fn());

vi.mock('@stellar/stellar-sdk', () => ({
  Keypair: {
    fromPublicKey: mockFromPublicKey,
  },
}));

const mockPrismaUser = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { user: mockPrismaUser },
}));

// PrismaAdapter is called at module evaluation time inside authConfig.
// Mock it so importing auth-config does not attempt a real DB connection.
vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn().mockReturnValue({}),
}));

import { authConfig } from '@/lib/auth-config';

describe('Auth Credentials Provider (authorize)', () => {
  // The Credentials provider is the first (and only) provider in authConfig.
  // We cast to `any` to access the authorize callback without needing NextAuth types.
  let authorize: (credentials: Record<string, unknown>) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFromPublicKey.mockReturnValue({ verify: mockVerify });
    authorize = (authConfig.providers[0] as any).authorize;
  });

  // ────────────────────────────────────────────────────────────
  // Registration path
  // ────────────────────────────────────────────────────────────

  it('should register a new user when valid signature and username are provided', async () => {
    const walletAddress = 'GVALIDWALLETREGISTRATION1234567';
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
    mockPrismaUser.findUnique.mockResolvedValue(null); // user does not exist yet
    mockPrismaUser.create.mockResolvedValue(createdUser);

    const result = await authorize({
      walletAddress,
      signature: 'dmFsaWRzaWduYXR1cmU=',
      message: 'Please sign this message to authenticate with Geev.',
      username: 'alice',
    });

    expect(result).not.toBeNull();
    expect((result as any).walletAddress).toBe(walletAddress);
    expect(mockPrismaUser.create).toHaveBeenCalledWith(
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
    const walletAddress = 'GREGISTERWITHMAIL12345678';
    mockVerify.mockReturnValue(true);
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaUser.create.mockResolvedValue({
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
      message: 'sign-this',
      username: 'eve',
      email: 'eve@example.com',
    });

    expect(result).not.toBeNull();
    expect(mockPrismaUser.create).toHaveBeenCalledWith(
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
      walletAddress: 'GEXISTINGWALLET12345678',
      name: 'Bob',
      username: 'bob',
      email: 'bob@example.com',
      bio: 'My bio',
      avatarUrl: null,
      createdAt: new Date(),
    };

    mockVerify.mockReturnValue(true);
    mockPrismaUser.findUnique.mockResolvedValue(existingUser);

    const result = await authorize({
      walletAddress: 'GEXISTINGWALLET12345678',
      signature: 'dmFsaWRzaWduYXR1cmU=',
      message: 'sign-this',
      // no username → login, not registration
    });

    expect(result).not.toBeNull();
    expect((result as any).id).toBe('user_existing');
    expect(mockPrismaUser.create).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────
  // Failure paths
  // ────────────────────────────────────────────────────────────

  it('should return null when signature is invalid', async () => {
    mockFromPublicKey.mockReturnValue({ verify: vi.fn().mockReturnValue(false) });

    const result = await authorize({
      walletAddress: 'GVALIDWALLET123',
      signature: 'bad-sig',
      message: 'sign-this',
    });

    expect(result).toBeNull();
    expect(mockPrismaUser.create).not.toHaveBeenCalled();
  });

  it('should return null on login when user does not exist and no username provided', async () => {
    mockVerify.mockReturnValue(true);
    mockPrismaUser.findUnique.mockResolvedValue(null); // no such user

    const result = await authorize({
      walletAddress: 'GUNKNOWN12345678',
      signature: 'dmFsaWRzaWduYXR1cmU=',
      message: 'sign-this',
      // no username → attempted login, not registration
    });

    expect(result).toBeNull();
    expect(mockPrismaUser.create).not.toHaveBeenCalled();
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

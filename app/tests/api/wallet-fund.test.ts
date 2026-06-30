import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockRequest, parseResponse } from '../helpers/api';
import { POST } from '@/app/api/wallet/fund/route';

// Must be hoisted so they are available before module imports are resolved
const mockGetCurrentUser = vi.hoisted(() => vi.fn());

const mockVerifyStellarPayment = vi.hoisted(() => vi.fn());

const mockPrismaWalletTransaction = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
}));

const mockPrismaUser = vi.hoisted(() => ({
  update: vi.fn(),
}));

const mockTransaction = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock('@/lib/stellar', () => ({
  verifyStellarPayment: mockVerifyStellarPayment,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    walletTransaction: mockPrismaWalletTransaction,
    user: mockPrismaUser,
    $transaction: mockTransaction,
  },
}));

describe('POST /api/wallet/fund - Replay Protection and Destination Binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set the custodial address for tests
    process.env.STELLAR_CUSTODIAL_ADDRESS = 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456';
  });

  afterEach(() => {
    delete process.env.STELLAR_CUSTODIAL_ADDRESS;
  });

  describe('Simulated Funding (simulated=true)', () => {
    it('should fund wallet successfully with simulated payment', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      const mockTx = {
        id: 'txn_1',
        userId: 'user_1',
        amount: 50,
        type: 'fund',
        status: 'completed',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedUser = {
        walletBalance: 150,
        updatedAt: new Date(),
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockTransaction.mockResolvedValue([mockTx, mockUpdatedUser]);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: true,
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.balance).toBe(150);
      expect(data.data.simulated).toBe(true);
      expect(data.message).toBe('Wallet funded successfully');
    });
  });

  describe('On-Chain Funding Validations', () => {
    it('should return 400 when txHash is missing for on-chain funding', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: false,
          stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
          // txHash is missing
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('txHash is required for on-chain funding');
    });

    it('should return 400 when stellarAddress is missing for on-chain funding', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: false,
          txHash: 'abcdef123456',
          // stellarAddress is missing
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('stellarAddress is required for on-chain funding');
    });
  });

  describe('Destination Binding (Issue #348 - Part 1)', () => {
    it('should return 400 when stellarAddress does not match custodial address', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: false,
          txHash: 'abcdef123456',
          stellarAddress: 'GWRONG123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456', // Wrong address
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid destination address');
    });
  });

  describe('Ownership Binding (Issue #348 - Part 2)', () => {
    it('should return 403 when payment sender does not match user wallet address', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      mockVerifyStellarPayment.mockResolvedValue({
        amount: 50,
        asset: 'XLM',
        from: 'GATTACKER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', // Different from user's wallet
      });

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: false,
          txHash: 'abcdef123456',
          stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Payment sender does not match your wallet address');
    });

    it('should accept payment when sender matches user wallet address', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      const mockTx = {
        id: 'txn_1',
        userId: 'user_1',
        amount: 50,
        type: 'fund',
        status: 'completed',
        currency: 'XLM',
        txHash: 'abcdef123456',
        stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedUser = {
        walletBalance: 150,
        updatedAt: new Date(),
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      mockVerifyStellarPayment.mockResolvedValue({
        amount: 50,
        asset: 'XLM',
        from: 'GUSER123', // Matches user's wallet
      });

      mockPrismaWalletTransaction.findUnique.mockResolvedValue(null); // No existing transaction

      mockTransaction.mockResolvedValue([mockTx, mockUpdatedUser]);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: false,
          txHash: 'abcdef123456',
          stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.balance).toBe(150);
      expect(data.data.transaction.amount).toBe(50);
    });
  });

  describe('Replay Protection (Issue #348 - Part 3)', () => {
    it('should return 409 when transaction hash already exists with completed fund record', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      const existingTransaction = {
        id: 'txn_old',
        userId: 'user_1',
        type: 'fund',
        status: 'completed',
        amount: 50,
        txHash: 'abcdef123456',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      mockVerifyStellarPayment.mockResolvedValue({
        amount: 50,
        asset: 'XLM',
        from: 'GUSER123',
      });

      mockPrismaWalletTransaction.findUnique.mockResolvedValue(existingTransaction);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: false,
          txHash: 'abcdef123456',
          stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Transaction already credited');
    });

    it('should handle Prisma unique constraint violation (P2002) and return 409', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      mockVerifyStellarPayment.mockResolvedValue({
        amount: 50,
        asset: 'XLM',
        from: 'GUSER123',
      });

      mockPrismaWalletTransaction.findUnique.mockResolvedValue(null);

      // Simulate Prisma P2002 error (unique constraint violation)
      const prismaError = new Error('Unique constraint failed on the fields: (`txHash`)');
      (prismaError as any).code = 'P2002';
      (prismaError as any).meta = { target: ['txHash'] };

      mockTransaction.mockRejectedValue(prismaError);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: false,
          txHash: 'abcdef123456',
          stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Transaction already credited');
    });

    it('should allow first-time submission of valid transaction', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      const mockTx = {
        id: 'txn_1',
        userId: 'user_1',
        amount: 50,
        type: 'fund',
        status: 'completed',
        currency: 'XLM',
        txHash: 'abcdef123456',
        stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedUser = {
        walletBalance: 150,
        updatedAt: new Date(),
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      mockVerifyStellarPayment.mockResolvedValue({
        amount: 50,
        asset: 'XLM',
        from: 'GUSER123',
      });

      mockPrismaWalletTransaction.findUnique.mockResolvedValue(null); // No existing transaction

      mockTransaction.mockResolvedValue([mockTx, mockUpdatedUser]);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: false,
          txHash: 'abcdef123456',
          stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.balance).toBe(150);
      expect(data.data.transaction.txHash).toBe('abcdef123456');
      expect(data.message).toBe('Wallet funded successfully');
    });
  });

  describe('Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: true,
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Validation', () => {
    it('should return 400 when amount is not positive', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: -50, // Negative amount
          simulated: true,
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Amount must be greater than 0');
    });

    it('should return 400 when method is invalid', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: true,
          method: 'invalid_method', // Invalid method
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Stellar Payment Verification', () => {
    it('should handle verification failure with appropriate error message', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      mockVerifyStellarPayment.mockRejectedValue(
        new Error('Transaction not found on Stellar network'),
      );

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: false,
          txHash: 'invalid_hash',
          stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Transaction not found on Stellar network');
    });

    it('should return the verified payment details including from address', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      const mockTx = {
        id: 'txn_1',
        userId: 'user_1',
        amount: 100,
        type: 'fund',
        status: 'completed',
        currency: 'XLM',
        txHash: 'verified_hash_123',
        stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedUser = {
        walletBalance: 200,
        updatedAt: new Date(),
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      mockVerifyStellarPayment.mockResolvedValue({
        amount: 100,
        asset: 'XLM',
        from: 'GUSER123',
      });

      mockPrismaWalletTransaction.findUnique.mockResolvedValue(null);

      mockTransaction.mockResolvedValue([mockTx, mockUpdatedUser]);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 100,
          simulated: false,
          txHash: 'verified_hash_123',
          stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(mockVerifyStellarPayment).toHaveBeenCalledWith(
        'verified_hash_123',
        'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        100,
      );
    });
  });

  describe('Concurrency and Edge Cases', () => {
    it('should allow the same user to submit different transactions', async () => {
      const mockUser = {
        id: 'user_1',
        walletAddress: 'GUSER123',
      };

      const mockTx1 = {
        id: 'txn_1',
        userId: 'user_1',
        amount: 50,
        type: 'fund',
        status: 'completed',
        currency: 'XLM',
        txHash: 'hash_1',
        stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
      };

      const mockUpdatedUser1 = {
        walletBalance: 150,
        updatedAt: new Date(),
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      mockVerifyStellarPayment.mockResolvedValue({
        amount: 50,
        asset: 'XLM',
        from: 'GUSER123',
      });

      mockPrismaWalletTransaction.findUnique.mockResolvedValue(null);

      mockTransaction.mockResolvedValue([mockTx1, mockUpdatedUser1]);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: false,
          txHash: 'hash_1',
          stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        },
      });

      const response = await POST(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(201);
    });

    it('should reject transaction from different user with same txHash', async () => {
      const mockUser = {
        id: 'user_2',
        walletAddress: 'GUSER456',
      };

      const existingTransaction = {
        id: 'txn_old',
        userId: 'user_1', // Different user
        type: 'fund',
        status: 'completed',
        amount: 50,
        txHash: 'shared_hash',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      mockVerifyStellarPayment.mockResolvedValue({
        amount: 50,
        asset: 'XLM',
        from: 'GUSER456',
      });

      mockPrismaWalletTransaction.findUnique.mockResolvedValue(existingTransaction);

      const request = createMockRequest('http://localhost:3000/api/wallet/fund', {
        method: 'POST',
        body: {
          amount: 50,
          simulated: false,
          txHash: 'shared_hash',
          stellarAddress: 'GCUSTODIAL123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        },
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(409);
      expect(data.error).toBe('Transaction already credited');
    });
  });
});

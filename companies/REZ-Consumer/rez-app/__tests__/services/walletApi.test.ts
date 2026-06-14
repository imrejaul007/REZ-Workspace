// @ts-nocheck
/**
 * Unit Tests for Wallet API Service
 */

import walletApi from '@/services/walletApi';

const { get: mockGet, post: mockPost } = (global as any).__mockApiClient;

describe('walletApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should get wallet balance successfully', async () => {
      const mockBalance = {
        success: true,
        data: {
          balance: { total: 1000, available: 950, pending: 50, cashback: 100 },
          totalValue: 1000,
          breakdown: { rezCoins: { amount: 800, color: '#6366f1' }, cashbackBalance: 100, pendingRewards: 50 },
          coins: [],
          brandedCoins: [],
          brandedCoinsTotal: 0,
          promoCoins: { amount: 0, color: '#f59e0b' },
          coinUsageOrder: [],
          savingsInsights: { totalSaved: 1000, thisMonth: 250, avgPerVisit: 50 },
          currency: 'INR',
          statistics: { totalEarned: 5000, totalSpent: 3000, totalCashback: 500, totalRefunds: 100, totalTopups: 2000, totalWithdrawals: 500 },
          limits: { maxBalance: 100000, dailySpendLimit: 10000, monthlySpendLimit: 100000 },
        },
      };

      mockGet.mockResolvedValueOnce(mockBalance);

      const result = await walletApi.getBalance();

      expect(mockGet).toHaveBeenCalledWith('/wallet/balance');
      expect(result.success).toBe(true);
      expect(result.data?.balance.total).toBe(1000);
    });

    it('should handle balance fetch error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const result = await walletApi.getBalance();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error');
    });
  });

  describe('getTransactions', () => {
    it('should get transaction history', async () => {
      const mockTransactions = {
        success: true,
        data: {
          transactions: [
            { id: '1', type: 'earning', description: 'Shopping reward', amount: 50, timestamp: '2025-01-01T00:00:00Z' },
            { id: '2', type: 'redemption', description: 'Cashback redeemed', amount: -30, timestamp: '2025-01-02T00:00:00Z' },
          ],
          total: 2,
        },
      };

      mockGet.mockResolvedValueOnce(mockTransactions);

      const result = await walletApi.getTransactions({ limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/wallet/transactions', { limit: 10 });
      expect(result.success).toBe(true);
      expect(result.data?.transactions).toHaveLength(2);
    });

    it('should handle transactions fetch error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Failed to fetch'));

      const result = await walletApi.getTransactions();

      expect(result.success).toBe(false);
    });
  });

  describe('initiateTransfer', () => {
    it('should initiate coin transfer', async () => {
      const mockResponse = {
        success: true,
        data: { transferId: 'txf_123', requiresOtp: true, recipientName: 'John Doe', amount: 100, coinType: 'rez' },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await walletApi.initiateTransfer({ recipientId: 'user_456', amount: 100, coinType: 'rez' });

      expect(mockPost).toHaveBeenCalledWith(
        '/wallet/transfer/initiate',
        expect.objectContaining({ recipientId: 'user_456', amount: 100, coinType: 'rez' }),
        expect.any(Object),
      );
      expect(result.success).toBe(true);
      expect(result.data?.transferId).toBe('txf_123');
    });

    it('should handle transfer initiation error', async () => {
      mockPost.mockRejectedValueOnce(new Error('Insufficient balance'));

      const result = await walletApi.initiateTransfer({ recipientId: 'user_456', amount: 100, coinType: 'rez' });

      expect(result.success).toBe(false);
    });
  });

  describe('confirmTransfer', () => {
    it('should confirm coin transfer with OTP', async () => {
      const mockResponse = {
        success: true,
        data: { transferId: 'txf_123', status: 'completed', amount: 100, coinType: 'rez' },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await walletApi.confirmTransfer({ transferId: 'txf_123', otp: '123456' });

      expect(mockPost).toHaveBeenCalledWith(
        '/wallet/transfer/confirm',
        expect.objectContaining({ transferId: 'txf_123', otp: '123456' }),
        expect.any(Object),
      );
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('completed');
    });

    it('should handle invalid OTP', async () => {
      mockPost.mockRejectedValueOnce(new Error('Invalid OTP'));

      const result = await walletApi.confirmTransfer({ transferId: 'txf_123', otp: '000000' });

      expect(result.success).toBe(false);
    });
  });

  describe('getTransferHistory', () => {
    it('should get transfer history', async () => {
      const mockHistory = {
        success: true,
        data: {
          transfers: [{ id: 'txf_1', recipientId: 'user_456', amount: 100, status: 'completed', timestamp: '2025-01-01T00:00:00Z' }],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false },
        },
      };

      mockGet.mockResolvedValueOnce(mockHistory);

      const result = await walletApi.getTransferHistory({ limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.transfers).toHaveLength(1);
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const mockResponse = {
        success: true,
        data: { transactionId: 'txn_123', amount: 500, status: 'completed' },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await walletApi.processPayment({ amount: 500, description: 'Bill payment' });

      expect(mockPost).toHaveBeenCalledWith(
        '/wallet/payment',
        expect.objectContaining({ amount: 500, description: 'Bill payment' }),
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });
  });
});

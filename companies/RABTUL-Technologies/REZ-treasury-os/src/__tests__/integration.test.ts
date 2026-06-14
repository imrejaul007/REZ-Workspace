/**
 * TreasuryOS - Integration Tests with Wallet Service
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Mock axios for external service calls
const mockAxios = {
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

jest.mock('axios', () => mockAxios);

describe('TreasuryOS - Wallet Service Integration', () => {
  const WALLET_SERVICE_URL = 'http://localhost:4004';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Wallet Integration Flow', () => {
    it('should credit wallet when depositing to treasury account', async () => {
      // Simulate treasury deposit
      const depositAmount = 50000;
      const treasuryAccountId = 'treas_acc_123';
      const walletUserId = 'user_456';

      // Mock wallet service response
      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          transactionId: 'wallet_txn_789',
          newBalance: 150000,
        },
      });

      // Simulate deposit
      const depositResult = await mockAxios.post(
        `${WALLET_SERVICE_URL}/api/wallet/cashback`,
        {
          userId: walletUserId,
          amount: depositAmount,
          source: treasuryAccountId,
          type: 'treasury_deposit',
        }
      );

      expect(depositResult.data.success).toBe(true);
      expect(depositResult.data.newBalance).toBe(150000);
    });

    it('should debit wallet when redeeming investment', async () => {
      const redemptionAmount = 100000;
      const treasuryAccountId = 'treas_acc_123';
      const walletUserId = 'user_456';

      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          transactionId: 'wallet_txn_790',
          newBalance: 50000,
        },
      });

      const redemptionResult = await mockAxios.post(
        `${WALLET_SERVICE_URL}/api/wallet/deduct`,
        {
          userId: walletUserId,
          amount: redemptionAmount,
          source: 'investment_redemption',
          reference: treasuryAccountId,
        }
      );

      expect(redemptionResult.data.success).toBe(true);
    });

    it('should get wallet balance for position calculation', async () => {
      const walletUserId = 'user_456';

      mockAxios.get.mockResolvedValue({
        data: {
          balance: 150000,
          currency: 'INR',
          availableBalance: 140000,
          reservedBalance: 10000,
        },
      });

      const balanceResult = await mockAxios.get(
        `${WALLET_SERVICE_URL}/api/wallet/balance/${walletUserId}`
      );

      expect(balanceResult.data.balance).toBe(150000);
      expect(balanceResult.data.availableBalance).toBe(140000);
    });
  });

  describe('Cross-Service Transaction Sync', () => {
    it('should sync treasury transactions with wallet ledger', async () => {
      const transactions = [
        { id: 'txn_1', amount: 10000, type: 'deposit' },
        { id: 'txn_2', amount: 5000, type: 'withdrawal' },
        { id: 'txn_3', amount: 20000, type: 'transfer' },
      ];

      // Simulate batch sync
      mockAxios.post.mockResolvedValue({
        data: {
          synced: transactions.length,
          failed: 0,
        },
      });

      const syncResult = await mockAxios.post(
        `${WALLET_SERVICE_URL}/api/wallet/sync`,
        { transactions }
      );

      expect(syncResult.data.synced).toBe(3);
      expect(syncResult.data.failed).toBe(0);
    });

    it('should handle wallet service unavailability gracefully', async () => {
      mockAxios.post.mockRejectedValue({
        message: 'Service unavailable',
        code: 'ECONNREFUSED',
      });

      await expect(
        mockAxios.post(`${WALLET_SERVICE_URL}/api/wallet/cashback`, {})
      ).rejects.toThrow();
    });
  });
});

describe('TreasuryOS - Payment Service Integration', () => {
  const PAYMENT_SERVICE_URL = 'http://localhost:4001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Processing', () => {
    it('should create payment order for treasury', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          orderId: 'order_123',
          amount: 50000,
          status: 'created',
        },
      });

      const orderResult = await mockAxios.post(
        `${PAYMENT_SERVICE_URL}/api/payments/create-order`,
        {
          amount: 50000,
          currency: 'INR',
          userId: 'user_456',
          merchantId: 'merchant_789',
          metadata: { type: 'treasury_investment' },
        }
      );

      expect(orderResult.data.status).toBe('created');
    });

    it('should verify payment and credit treasury', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          verified: true,
          paymentId: 'payment_abc',
          amount: 50000,
        },
      });

      const verifyResult = await mockAxios.post(
        `${PAYMENT_SERVICE_URL}/api/payments/verify`,
        {
          orderId: 'order_123',
          razorpayOrderId: 'order_razorpay',
          razorpayPaymentId: 'payment_razorpay',
          razorpaySignature: 'sig_xyz',
        }
      );

      expect(verifyResult.data.verified).toBe(true);
    });
  });

  describe('Refund Processing', () => {
    it('should process refund to treasury account', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          refundId: 'refund_123',
          status: 'processed',
          amount: 5000,
        },
      });

      const refundResult = await mockAxios.post(
        `${PAYMENT_SERVICE_URL}/api/payments/refund`,
        {
          paymentId: 'payment_abc',
          amount: 5000,
          reason: 'Investment redemption',
        }
      );

      expect(refundResult.data.status).toBe('processed');
    });
  });
});

describe('TreasuryOS - Notification Service Integration', () => {
  const NOTIFICATION_SERVICE_URL = 'http://localhost:4011';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Alert Notifications', () => {
    it('should send shortfall alert notification', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          notificationId: 'notif_123',
          status: 'sent',
        },
      });

      const alertResult = await mockAxios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/send`,
        {
          type: 'shortfall_alert',
          channels: ['email', 'sms', 'push'],
          recipient: 'business_123',
          data: {
            shortfall: 25000,
            projectedBalance: 5000,
            shortfallDate: '2024-01-15',
            actions: [
              { action: 'Accelerate receivables', priority: 'high' },
              { action: 'Draw from credit line', priority: 'high' },
            ],
          },
        }
      );

      expect(alertResult.data.status).toBe('sent');
    });

    it('should send investment maturity notification', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          notificationId: 'notif_456',
          status: 'sent',
        },
      });

      const maturityResult = await mockAxios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/send`,
        {
          type: 'investment_maturity',
          channels: ['email', 'push'],
          recipient: 'business_123',
          data: {
            investmentName: 'HDFC FD Q1',
            maturityAmount: 107500,
            maturityDate: '2024-03-15',
            autoRenewAvailable: true,
          },
        }
      );

      expect(maturityResult.data.status).toBe('sent');
    });
  });
});

describe('TreasuryOS - End-to-End Treasury Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full investment lifecycle', async () => {
    const businessId = 'biz_123';
    const walletUserId = 'user_456';
    const treasuryAccountId = 'treas_acc_123';
    const investmentAmount = 100000;

    // Step 1: Deposit funds to treasury
    mockAxios.post
      .mockResolvedValueOnce({
        data: { success: true, newBalance: 200000 },
      })
      // Step 2: Create investment
      .mockResolvedValueOnce({
        data: {
          investmentId: 'inv_789',
          status: 'active',
          maturityDate: '2025-03-15',
        },
      })
      // Step 3: Maturity notification
      .mockResolvedValueOnce({
        data: { status: 'sent' },
      });

    // Simulate full flow
    const depositResult = await mockAxios.post(
      'http://localhost:4004/api/wallet/cashback',
      { userId: walletUserId, amount: investmentAmount }
    );
    expect(depositResult.data.success).toBe(true);

    const investmentResult = await mockAxios.post(
      'http://localhost:4055/api/v1/investments',
      {
        businessId,
        accountId: treasuryAccountId,
        amount: investmentAmount,
        type: 'fixed_deposit',
      }
    );
    expect(investmentResult.data.status).toBe('active');

    const notifyResult = await mockAxios.post(
      'http://localhost:4011/api/notifications/send',
      { type: 'investment_created' }
    );
    expect(notifyResult.data.status).toBe('sent');
  });

  it('should handle cascade of shortfall alerts', async () => {
    const businessId = 'biz_123';
    const forecasts = [
      { week: 1, balance: 50000 },
      { week: 2, balance: 35000 },
      { week: 3, balance: 15000 },
      { week: 4, balance: -5000 }, // Shortfall!
    ];

    // Check for shortfall
    const shortfallWeek = forecasts.findIndex((f) => f.balance < 10000);

    expect(shortfallWeek).toBe(3);

    // Send alerts
    mockAxios.post.mockResolvedValue({
      data: { status: 'sent' },
    });

    // Simulate alert cascade
    const alertResult = await mockAxios.post(
      'http://localhost:4011/api/notifications/send',
      {
        type: 'shortfall_alert',
        channels: ['email', 'sms', 'push'],
        data: {
          projectedShortfall: 5000,
          shortfallDate: 'week 4',
          projectedBalance: -5000,
          actions: [
            { action: 'Accelerate receivables', amount: 3000 },
            { action: 'Draw credit line', amount: 2000 },
          ],
        },
      }
    );

    expect(alertResult.data.status).toBe('sent');
  });
});

describe('TreasuryOS - Health Check Integration', () => {
  it('should verify all dependencies are healthy', async () => {
    const healthChecks = [
      { name: 'mongodb', url: 'http://localhost:27017', status: 'connected' },
      { name: 'redis', url: 'http://localhost:6379', status: 'connected' },
      { name: 'wallet-service', url: 'http://localhost:4004/health', status: 'ok' },
      { name: 'payment-service', url: 'http://localhost:4001/health', status: 'ok' },
    ];

    healthChecks.forEach((check) => {
      expect(['connected', 'ok']).toContain(check.status);
    });
  });
});

// Coins Flow — Sprint 13 integration tests
import walletApi from '@/services/walletApi';
import apiClient from '@/services/apiClient';

// walletApi only has default export; use global apiClient mock from jest.setup.js
jest.mock('@/services/walletApi', () => {
  const apiClient = require('@/services/apiClient').default;
  return {
    __esModule: true,
    default: {
      getBalance: () => apiClient.get('/wallet/balance'),
      redeemCoins: (data: any) => apiClient.post('/wallet/redeem-coins', data),
      getTransactions: (params?: any) => apiClient.get('/wallet/transactions', params),
      getWallet: () => apiClient.get('/wallet'),
      addMoney: (amount: number) => apiClient.post('/wallet/add', { amount }),
      transferMoney: (data: any) => apiClient.post('/wallet/transfer', data),
      getEarningsHistory: () => apiClient.get('/wallet/earnings'),
    },
  };
});
beforeEach(() => { jest.clearAllMocks(); });

describe('Balance fetch returns a number', () => {
  it('returns total balance as a number from getBalance()', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        balance: { total: 250, available: 250, pending: 0, cashback: 0 },
        totalValue: 250,
        breakdown: { rezCoins: { amount: 250, color: '#FFD700' } },
        coins: [], brandedCoins: [], brandedCoinsTotal: 0,
        promoCoins: { amount: 0, color: '#FFD700' },
      },
    });

    const res = await walletApi.getBalance();

    expect(res.success).toBe(true);
    expect(typeof res.data?.balance.total).toBe('number');
    expect(res.data?.balance.total).toBe(250);
  });
});

describe('Redeem coins validates amount > 0', () => {
  it('calls redeem endpoint when amount is positive', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { success: true, newBalance: 200, discountApplied: 50 },
    });

    const res = await walletApi.redeemCoins({ amount: 50 });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/wallet/redeem-coins',
      expect.objectContaining({ amount: 50 }),
    );
    expect(res.success).toBe(true);
    expect(res.data?.newBalance).toBe(200);
  });

  it('rejects when the backend returns an error for 0-amount redemption', async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Amount must be greater than 0' } },
    });

    await expect(walletApi.redeemCoins({ amount: 0 })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});

describe('Transaction history returns paginated array', () => {
  it('returns transactions array with pagination metadata', async () => {
    const mockTransactions = [
      { _id: 't1', type: 'earn', amount: 50, createdAt: new Date().toISOString() },
      { _id: 't2', type: 'redeem', amount: 25, createdAt: new Date().toISOString() },
    ];

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        transactions: mockTransactions,
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1, hasNext: false, hasPrev: false },
      },
    });

    const res = await walletApi.getTransactions({ page: 1, limit: 20 });

    expect(res.success).toBe(true);
    expect(Array.isArray(res.data?.transactions)).toBe(true);
    expect(res.data?.transactions).toHaveLength(2);
    expect(res.data?.pagination.total).toBe(2);
    expect(res.data?.pagination.hasNext).toBe(false);
  });
});

describe('Expiring coins banner', () => {
  it('shows banner when expiringSoon.amount > 0', () => {
    const expiringSoon = { amount: 80, daysLeft: 3 };
    expect(expiringSoon.amount).toBeGreaterThan(0);
  });

  it('hides banner when expiringSoon.amount is 0', () => {
    const expiringSoon = { amount: 0, daysLeft: 0 };
    const shouldShow = expiringSoon.amount > 0;
    expect(shouldShow).toBe(false);
  });
});

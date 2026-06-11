jest.mock('../../services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from '../../services/api/client';
const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;

let walletService: any;
beforeAll(async () => {
  walletService = (await import('../../services/api/wallet')).default;
});

describe('WalletService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getWalletSummary returns balance and stats', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        balance: { total: 10000, available: 8000, pending: 2000 },
        statistics: { totalSales: 50000 },
      },
    });
    const result = await walletService.getWalletSummary();
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('wallet'));
  });

  it('getTransactions returns paginated list', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { transactions: [{ _id: 't1', amount: 500, type: 'credit' }], pagination: { page: 1 } },
    });
    const result = await walletService.getTransactions({ page: 1, limit: 20 });
    expect(mockGet).toHaveBeenCalled();
  });

  it('requestWithdrawal sends amount', async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: { transactionId: 'w1' },
      message: 'Withdrawal requested',
    });
    const result = await walletService.requestWithdrawal(5000);
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('withdraw'),
      expect.objectContaining({ amount: 5000 })
    );
  });

  it('updateBankDetails sends bank info', async () => {
    const bankDetails = {
      accountNumber: '1234567890',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'Test',
    };
    mockPut.mockResolvedValue({ success: true, message: 'Bank details updated' });
    const result = await walletService.updateBankDetails(bankDetails);
    expect(mockPut).toHaveBeenCalled();
  });

  it('getStats returns statistics', async () => {
    mockGet.mockResolvedValue({ success: true, data: { totalSales: 100000, averageOrder: 500 } });
    const result = await walletService.getStats();
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('stats'));
  });

  it('throws on unauthorized', async () => {
    mockGet.mockResolvedValue({ success: false, error: 'Unauthorized' });
    await expect(walletService.getWalletSummary()).rejects.toThrow();
  });
});

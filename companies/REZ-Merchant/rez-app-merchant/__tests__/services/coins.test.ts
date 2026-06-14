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

let coinsService: any;
beforeAll(async () => {
  const mod = require('../../services/api/coins');
  coinsService = mod.default;
});

describe('CoinsService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('searchCustomer calls correct endpoint', async () => {
    mockGet.mockResolvedValue({ success: true, data: [{ id: 'u1', name: 'John' }] });
    const result = await coinsService.searchCustomer('john');
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('search-customer'));
    expect(result).toHaveLength(1);
  });

  it('awardCoins sends correct payload', async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: { userId: 'u1', amount: 100, storeName: 'Test Store' },
      message: 'Coins awarded',
    });
    const result = await coinsService.awardCoins({ userId: 'u1', storeId: 's1', amount: 100 });
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('coins/award'),
      expect.objectContaining({ userId: 'u1', amount: 100 })
    );
    expect(result.success).toBe(true);
  });

  it('getAwardHistory returns paginated data', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { transactions: [{ id: 't1', amount: 50 }], pagination: { page: 1, total: 1 } },
    });
    const result = await coinsService.getAwardHistory(1, 20);
    expect(result.transactions).toHaveLength(1);
  });

  it('getStats returns coin statistics', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        overall: { totalCoinsAwarded: 5000, totalAwards: 100 },
        today: { coinsAwarded: 200 },
      },
    });
    const result = await coinsService.getStats('store1');
    expect(result.overall.totalCoinsAwarded).toBe(5000);
  });

  it('throws on API error', async () => {
    mockGet.mockResolvedValue({ success: false, error: 'Unauthorized' });
    await expect(coinsService.searchCustomer('test')).rejects.toThrow();
  });
});

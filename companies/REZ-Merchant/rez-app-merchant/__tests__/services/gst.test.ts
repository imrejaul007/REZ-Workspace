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

let gstService: any;
beforeAll(async () => {
  const mod = require('../../services/api/gst');
  gstService = mod.default;
});

describe('GSTService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getGSTR1 returns sales and tax data', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { period: '2026-04', totalSales: 150000, totalTax: 27000, count: 85 },
    });
    const result = await gstService.getGSTR1('store123', '2026-04');
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('gstr1'));
    expect(result.totalSales).toBe(150000);
    expect(result.count).toBe(85);
  });

  it('getGSTR3B returns tax breakdown', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { period: '2026-04', taxableValue: 150000, cgst: 13500, sgst: 13500, igst: 0 },
    });
    const result = await gstService.getGSTR3B('store123', '2026-04');
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('gstr3b'));
    expect(result.cgst).toBe(13500);
    expect(result.sgst).toBe(13500);
  });

  it('throws on API failure', async () => {
    mockGet.mockResolvedValue({ success: false, error: 'Store not found' });
    await expect(gstService.getGSTR1('bad', '2026-01')).rejects.toThrow();
  });
});

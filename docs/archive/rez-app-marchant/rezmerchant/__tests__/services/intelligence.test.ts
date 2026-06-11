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

let intelligenceService: any;
beforeAll(async () => {
  intelligenceService = (await import('../../services/api/intelligence')).default;
});

describe('IntelligenceService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getDeadHours returns hourly data', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        hours: [{ hour: 9, revenue: 1000, count: 5 }],
        deadHours: [{ hour: 15, revenue: 50, count: 1 }],
        peakHour: { hour: 13, revenue: 5000, count: 20 },
      },
    });
    const result = await intelligenceService.getDeadHours('store123');
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('dead-hours'));
    expect(result.deadHours).toHaveLength(1);
  });

  it('getROIHero returns ROI metrics', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { totalRevenue: 500000, roi: 3.5, uniqueCustomers: 200 },
    });
    const result = await intelligenceService.getROIHero('store123');
    expect(result.roi).toBe(3.5);
  });

  it('getActionCenter returns action items', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        actions: [
          { id: 'a1', type: 'opportunity', priority: 'high', title: 'Run happy hour deal' },
        ],
        lastUpdated: '2026-04-09',
      },
    });
    const result = await intelligenceService.getActionCenter('store123');
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].priority).toBe('high');
  });

  it('getAttribution returns attribution summary', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { period: '30d', revenue: 100000, customers: 50, coinsIssued: 5000 },
    });
    const result = await intelligenceService.getAttribution('store123', '30d');
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('attribution'));
    expect(result.customers).toBe(50);
  });

  it('throws on failure', async () => {
    mockGet.mockResolvedValue({ success: false, error: 'Not found' });
    await expect(intelligenceService.getDeadHours('bad')).rejects.toThrow();
  });
});

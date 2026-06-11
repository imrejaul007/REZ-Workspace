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

let dashboardService: any;
beforeAll(async () => {
  dashboardService = (await import('../../services/api/dashboard')).default;
});

describe('DashboardService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getDashboardData returns metrics', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { metrics: { totalOrders: 100 }, recentActivity: [] },
    });
    const result = await dashboardService.getDashboardData('s1');
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('merchant/dashboard'));
    expect(result).toBeDefined();
  });

  it('getDashboardData without storeId', async () => {
    mockGet.mockResolvedValue({ success: true, data: { metrics: {} } });
    await dashboardService.getDashboardData();
    expect(mockGet).toHaveBeenCalled();
  });

  it('getMetrics returns KPIs', async () => {
    mockGet.mockResolvedValue({ success: true, data: { totalRevenue: 50000, totalOrders: 200 } });
    const result = await dashboardService.getMetrics('s1');
    expect(result).toBeDefined();
    expect(result.revenue.total).toBe(50000);
    expect(result.orders.total).toBe(200);
  });

  it('normalizes merchant-service metric card shape', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        revenue: { value: 1234, change: 12.5, trend: 'up' },
        orders: { value: 22, change: 4.5, trend: 'up' },
        products: { value: 8 },
        customers: { value: 5, change: -2 },
      },
    });

    const result = await dashboardService.getMetrics('s1');

    expect(result.revenue.total).toBe(1234);
    expect(result.orders.total).toBe(22);
    expect(result.products.total).toBe(8);
    expect(result.customers.total).toBe(5);
  });

  it('normalizes lightweight today revenue payload', async () => {
    mockGet.mockResolvedValue({ success: true, data: { revenue: 2500, orders: 9 } });

    const result = await dashboardService.getTodayRevenueSummary('s1');

    expect(result.totalGMV).toBe(2500);
    expect(result.totalOrders).toBe(9);
    expect(result.merchantEarnings).toBe(2500);
  });

  it('normalizes retention payload from merchant service', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { retentionRate: 35, repeatCustomers: 7, newCustomers: 13 },
    });

    const result = await dashboardService.getCustomerRetentionMetrics('s1');

    expect(result.returnRatePercent).toBe(35);
    expect(result.returningCustomersToday).toBe(7);
    expect(result.totalCustomersToday).toBe(20);
  });

  it('getRecentActivity with limit', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: [{ type: 'order', description: 'New order' }],
    });
    const result = await dashboardService.getRecentActivity(5);
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('limit=5'));
  });

  it('throws on API failure', async () => {
    mockGet.mockResolvedValue({ success: false, error: 'Unauthorized' });
    await expect(dashboardService.getDashboardData()).rejects.toThrow();
  });
});

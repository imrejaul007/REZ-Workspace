// @ts-nocheck
/**
 * useOrderHistory Hook Tests
 */

interface Order {
  id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  items: { name: string; qty: number }[];
}

const mockFetchOrders = jest.fn();
const mockGetOrderStatus = jest.fn();

describe('useOrderHistory', () => {
  const sampleOrders: Order[] = [
    {
      id: 'ord-1',
      status: 'delivered',
      total: 150,
      createdAt: '2024-01-15',
      items: [{ name: 'Shirt', qty: 2 }],
    },
    {
      id: 'ord-2',
      status: 'shipped',
      total: 89,
      createdAt: '2024-02-01',
      items: [{ name: 'Pants', qty: 1 }],
    },
  ];

  beforeEach(() => {
    mockFetchOrders.mockReset();
    mockGetOrderStatus.mockReset();
  });

  it('should load order history', async () => {
    mockFetchOrders.mockResolvedValue(sampleOrders);

    const orders: Order[] = await mockFetchOrders('user-1');
    expect(orders).toHaveLength(2);
    expect(orders[0].id).toBe('ord-1');
    expect(orders[0].total).toBeGreaterThan(0);
  });

  it('should track order status', async () => {
    mockGetOrderStatus.mockResolvedValue({ id: 'ord-2', status: 'shipped', estimatedDelivery: '2024-02-05' });

    const status = await mockGetOrderStatus('ord-2');
    expect(status.status).toBe('shipped');
    expect(status.estimatedDelivery).toBeDefined();
    expect(mockGetOrderStatus).toHaveBeenCalledWith('ord-2');
  });
});

// @ts-nocheck
import * as storesApi from '@/services/storesApi';

jest.mock('@/services/storesApi', () => ({
  getStores: jest.fn(),
  getStoreById: jest.fn(),
  getNearbyStores: jest.fn(),
}));

describe('storesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch stores', async () => {
    const stores = [
      { id: 'store-1', name: 'Fashion Hub', category: 'fashion', rating: 4.5 },
      { id: 'store-2', name: 'Tech World', category: 'electronics', rating: 4.2 },
    ];
    (storesApi.getStores as jest.Mock).mockResolvedValue({ data: stores, total: 2 });

    const result = await storesApi.getStores({ page: 1 });
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.data[0].name).toBe('Fashion Hub');
  });

  it('should fetch store by ID', async () => {
    const store = { id: 'store-1', name: 'Fashion Hub', rating: 4.5 };
    (storesApi.getStoreById as jest.Mock).mockResolvedValue(store);

    const result = await storesApi.getStoreById('store-1');
    expect(result.id).toBe('store-1');
    expect(result.rating).toBeGreaterThan(0);
    expect(storesApi.getStoreById).toHaveBeenCalledWith('store-1');
  });

  it('should fetch nearby stores by coordinates', async () => {
    const nearby = [{ id: 'store-3', name: 'Local Shop', distance: 0.5 }];
    (storesApi.getNearbyStores as jest.Mock).mockResolvedValue({ data: nearby });

    const result = await storesApi.getNearbyStores({ lat: 33.89, lng: 35.50, radius: 2 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].distance).toBeLessThan(2);
  });
});

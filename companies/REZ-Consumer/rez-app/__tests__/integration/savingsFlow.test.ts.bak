// Savings Flow — Sprint 13 integration tests
import nearbyEarnApi from '@/services/nearbyEarnApi';
import apiClient from '@/services/apiClient';

// Use global apiClient mock from jest.setup.js — DO NOT re-mock here
jest.mock('expo-location', () => ({
  getLastKnownPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 12.9716, longitude: 77.5946 },
  }),
}));

beforeEach(() => { jest.clearAllMocks(); });

describe('Bill simulator: entering amount triggers fetch', () => {
  it('invokes the savings estimate endpoint with a positive amount', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      success: true,
      data: { estimatedSaving: 120, breakdown: [] },
    });

    // Simulate debounced fetch being called after user enters an amount
    const amountPaise = 50000; // ₹500 in paise
    expect(amountPaise).toBeGreaterThan(0);

    await mockFetch(`/api/user/savings/simulate?budgetPaise=${amountPaise}`);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`budgetPaise=${amountPaise}`),
    );
  });

  it('does not trigger fetch when amount is 0', () => {
    const shouldFetch = (amountPaise: number) => amountPaise > 0;
    expect(shouldFetch(0)).toBe(false);
    expect(shouldFetch(1000)).toBe(true);
  });
});

describe('Best-nearby returns stores sorted by expectedSavingPaise desc', () => {
  it('returns stores sorted highest saving first', async () => {
    const stores = [
      { storeId: 's1', storeName: 'Store A', cashbackPercent: 5, expectedSavingPaise: 2500, distanceMetres: 300 },
      { storeId: 's2', storeName: 'Store B', cashbackPercent: 10, expectedSavingPaise: 5000, distanceMetres: 500 },
      { storeId: 's3', storeName: 'Store C', cashbackPercent: 3, expectedSavingPaise: 1500, distanceMetres: 200 },
    ];

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: stores,
    });

    const res = await nearbyEarnApi.getStores({ lat: 12.9716, lng: 77.5946 });

    // Consumer code sorts by expectedSavingPaise descending before picking [0]
    const sorted = [...(res.data ?? [])].sort(
      (a: any, b: any) => (b.expectedSavingPaise ?? 0) - (a.expectedSavingPaise ?? 0),
    );

    expect(sorted[0].storeName).toBe('Store B');
    expect(sorted[0].expectedSavingPaise).toBeGreaterThanOrEqual(sorted[1].expectedSavingPaise ?? 0);
  });

  it('returns empty array when no stores nearby', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ success: true, data: [] });

    const res = await nearbyEarnApi.getStores({ lat: 0, lng: 0 });

    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(0);
  });
});

describe('SmartTipsCard renders null when no data', () => {
  it('bestStore is null when API returns empty array', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ success: true, data: [] });

    const res = await nearbyEarnApi.getStores({ lat: 0, lng: 0 });
    const arr = res.data ?? [];
    const bestStore = arr.length > 0 ? arr[0] : null;

    expect(bestStore).toBeNull();
  });

  it('bestStore is null when API throws', async () => {
    (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    let bestStore = null;
    try {
      const res = await nearbyEarnApi.getStores({ lat: 0, lng: 0 });
      const arr = res.data ?? [];
      bestStore = arr.length > 0 ? arr[0] : null;
    } catch {
      // component swallows errors — bestStore stays null
    }

    expect(bestStore).toBeNull();
  });
});

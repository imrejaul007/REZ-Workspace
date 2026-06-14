// @ts-nocheck
/**
 * Unit Tests for useStoreSearch hook
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useStoreSearch } from '@/hooks/useStoreSearch';

jest.mock('@/services/storeSearchService', () => ({
  storeSearchService: {
    advancedStoreSearch: jest.fn(() => Promise.resolve({ stores: [], total: 0 })),
    searchStoresByCategory: jest.fn(() => Promise.resolve({ stores: [], total: 0 })),
    formatLocationForAPI: jest.fn(),
  },
}));

jest.mock('@/hooks/useLocation', () => ({
  useCurrentLocation: jest.fn(() => ({ currentLocation: null })),
}));

describe('useStoreSearch', () => {
  it('should search stores', async () => {
    const { result } = renderHook(() => useStoreSearch({ autoFetch: false }));

    act(() => {
      result.current.fetchStores(1);
    });

    await waitFor(() => {
      expect(result.current.stores).toBeDefined();
    });
  });

  it('should fetch stores with category', async () => {
    const { result } = renderHook(() => useStoreSearch({ category: 'restaurants' }));

    await waitFor(() => {
      expect(result.current.stores).toBeDefined();
    });
  });
});

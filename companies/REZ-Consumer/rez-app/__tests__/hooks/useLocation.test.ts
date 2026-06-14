// @ts-nocheck
/**
 * Unit Tests for useLocation hook
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useLocationPermission } from '@/hooks/useLocation';

// ── Mock dependencies ──────────────────────────────────────────────────────────

// Mock LocationContext — must match the actual interface used by useLocationPermission
jest.mock('@/contexts/LocationContext', () => ({
  useLocation: jest.fn(() => ({
    state: {
      permissionStatus: 'granted',
      isLocationEnabled: true,
      currentLocation: null,
      isLoading: false,
      error: null,
      locationHistory: [],
    },
    requestLocationPermission: jest.fn(() => Promise.resolve(true)),
    getCurrentLocation: jest.fn(() => Promise.resolve(null)),
    updateLocation: jest.fn(() => Promise.resolve()),
    setManualLocation: jest.fn(() => Promise.resolve()),
    searchAddresses: jest.fn(() => Promise.resolve([])),
    reverseGeocode: jest.fn(() => Promise.resolve(null)),
    validateAddress: jest.fn(() => Promise.resolve(true)),
    getLocationHistory: jest.fn(() => Promise.resolve([])),
    clearLocationHistory: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock store selectors
jest.mock('@/stores/selectors', () => ({
  useIsAuthenticated: jest.fn(() => true),
  useAuthUser: jest.fn(() => ({ id: 'user-1' })),
}));

describe('useLocationPermission', () => {
  it('should get location permission status', async () => {
    const { result } = renderHook(() => useLocationPermission());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBeDefined();
    });

    expect(result.current.permissionStatus).toBe('granted');
  });

  it('should indicate location is enabled', async () => {
    const { result } = renderHook(() => useLocationPermission());

    await waitFor(() => {
      expect(result.current.isLocationEnabled).toBeDefined();
    });

    expect(result.current.isLocationEnabled).toBe(true);
  });

  it('should expose requestPermission function', async () => {
    const { result } = renderHook(() => useLocationPermission());

    expect(typeof result.current.requestPermission).toBe('function');
  });

  it('should not be requesting initially', async () => {
    const { result } = renderHook(() => useLocationPermission());

    expect(result.current.isRequesting).toBe(false);
  });
});

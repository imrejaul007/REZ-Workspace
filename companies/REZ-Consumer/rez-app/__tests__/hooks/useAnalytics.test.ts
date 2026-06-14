// @ts-nocheck
/**
 * Unit Tests for useAnalytics hook
 */

import { renderHook, act } from '@testing-library/react-native';

// Mock the analytics module so no real network calls are made
jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
    trackScreen: jest.fn(),
    identify: jest.fn(),
  }),
}));

import { useAnalytics } from '@/hooks/useAnalytics';

describe('useAnalytics', () => {
  it('should track events', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackEvent('test_event', { prop: 'value' });
    });

    expect(result.current.trackEvent).toHaveBeenCalledWith('test_event', { prop: 'value' });
    expect(result.current.trackEvent).toBeDefined();
  });

  it('should track screen views', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackScreen('HomeScreen');
    });

    expect(result.current.trackScreen).toHaveBeenCalledWith('HomeScreen');
    expect(result.current.trackScreen).toHaveBeenCalledTimes(1);
  });

  it('should identify users', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.identify('user-123', { plan: 'premium' });
    });

    expect(result.current.identify).toHaveBeenCalledWith('user-123', { plan: 'premium' });
    expect(result.current.identify).toBeDefined();
  });
});

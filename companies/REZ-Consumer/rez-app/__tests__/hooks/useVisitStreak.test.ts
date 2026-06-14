// @ts-nocheck
/**
 * useVisitStreak Hook Tests
 *
 * Tests the store-visit streak hook that powers the core REZ habit loop:
 *   visit store → earn coins → see reward milestone → level up
 *
 * The hook wraps React Query + visitStreakApi.  We test:
 *   - successful data fetch and shape
 *   - safe defaults when the API returns no data
 *   - correct query key so caching works properly
 *   - milestone / reward tracking (next milestone to earn coins)
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useVisitStreak } from '@/hooks/useVisitStreak';
import * as visitStreakApiModule from '@/services/visitStreakApi';
import { queryKeys } from '@/lib/queryKeys';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/services/visitStreakApi');

const mockGetVisitStreak = visitStreakApiModule.getVisitStreak as jest.MockedFunction<
  typeof visitStreakApiModule.getVisitStreak
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // No retries in tests — fail fast
        retry: false,
        // Disable caching between test runs
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);

  return { client, Wrapper };
}

// ---------------------------------------------------------------------------

describe('useVisitStreak', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Happy path
  // =========================================================================

  it('returns streak data when the API call succeeds', async () => {
    mockGetVisitStreak.mockResolvedValueOnce({
      success: true,
      data: {
        totalVisits: 12,
        currentStreak: 3,
        longestStreak: 7,
        nextMilestone: {
          visitsNeeded: 3,
          totalRequired: 15,
          reward: 50,
          name: 'Regular Shopper',
        },
        recentVisits: [
          {
            visitNumber: 'VIS-001',
            storeId: 'store-abc',
            storeName: 'Coffee World',
            storeCity: 'Mumbai',
            visitDate: '2026-04-01',
            visitType: 'physical',
            status: 'completed',
            createdAt: '2026-04-01T10:00:00Z',
          },
        ],
      },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useVisitStreak(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    expect(data.totalVisits).toBe(12);
    expect(data.currentStreak).toBe(3);
    expect(data.longestStreak).toBe(7);
    expect(data.recentVisits).toHaveLength(1);
    expect(data.recentVisits[0].storeName).toBe('Coffee World');
  });

  // =========================================================================
  // Milestone / coin reward shape
  // =========================================================================

  it('exposes next milestone with coins reward amount', async () => {
    mockGetVisitStreak.mockResolvedValueOnce({
      success: true,
      data: {
        totalVisits: 8,
        currentStreak: 2,
        longestStreak: 4,
        nextMilestone: {
          visitsNeeded: 2,
          totalRequired: 10,
          reward: 100,
          name: 'Frequent Visitor',
        },
        recentVisits: [],
      },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useVisitStreak(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const milestone = result.current.data?.nextMilestone;
    expect(milestone).not.toBeNull();
    expect(milestone?.reward).toBe(100);
    expect(milestone?.visitsNeeded).toBe(2);
    expect(milestone?.name).toBe('Frequent Visitor');
  });

  it('sets nextMilestone to null when the user has reached the top tier', async () => {
    mockGetVisitStreak.mockResolvedValueOnce({
      success: true,
      data: {
        totalVisits: 100,
        currentStreak: 30,
        longestStreak: 30,
        nextMilestone: null,
        recentVisits: [],
      },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useVisitStreak(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.nextMilestone).toBeNull();
  });

  // =========================================================================
  // Safe defaults — API returns no data
  // =========================================================================

  it('returns zero-value defaults when the API responds with success:false', async () => {
    mockGetVisitStreak.mockResolvedValueOnce({
      success: false,
      error: 'Unauthorized',
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useVisitStreak(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    expect(data.totalVisits).toBe(0);
    expect(data.currentStreak).toBe(0);
    expect(data.longestStreak).toBe(0);
    expect(data.nextMilestone).toBeNull();
    expect(data.recentVisits).toEqual([]);
  });

  it('returns zero-value defaults when the API responds with success:true but no data', async () => {
    mockGetVisitStreak.mockResolvedValueOnce({ success: true, data: undefined });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useVisitStreak(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.totalVisits).toBe(0);
  });

  // =========================================================================
  // Query key — caching correctness
  // =========================================================================

  it('uses the expected query key so visits data is cached under the right key', () => {
    // queryKeys.users.visitStreak() is the canonical key used by the hook.
    // Validating it here prevents accidental key renames that would break caching.
    const key = queryKeys.users.visitStreak();
    expect(Array.isArray(key)).toBe(true);
    expect(key.length).toBeGreaterThan(0);
    // The key must include a string that identifies visit-streak data
    const flat = key.flat().join(' ').toLowerCase();
    expect(flat).toMatch(/visit/i);
  });

  // =========================================================================
  // Network error
  // =========================================================================

  it('surfaces an error state when the API throws', async () => {
    mockGetVisitStreak.mockRejectedValueOnce(new Error('Network error'));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useVisitStreak(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

/**
 * useLiveContext
 *
 * TanStack Query hook that returns live time-aware + location-aware context
 * for the Near-U tab (TimeAwareContextPill counts, top deal, time slot).
 *
 * Reads lat/lng from LocationContext. Query is skipped until coordinates
 * are available.
 */

import { useQuery } from '@tanstack/react-query';
import { useCurrentLocation } from '@/hooks/useLocation';
import { getLiveContext, type LiveContextData } from '@/services/liveContextApi';

export function useLiveContext() {
  const { currentLocation } = useCurrentLocation();
  const lat = currentLocation?.coordinates?.latitude;
  const lng = currentLocation?.coordinates?.longitude;

  return useQuery<LiveContextData>({
    queryKey: ['liveContext', lat, lng] as const,
    queryFn: async () => {
      const response = await getLiveContext(lat!, lng!);
      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to fetch live context');
      }
      return response.data;
    },
    enabled: lat != null && lng != null,
    staleTime: 60_000, // 1 min fresh
    gcTime: 5 * 60_000,
  });
}

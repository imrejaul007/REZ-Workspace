/**
 * useNearbyOffers
 *
 * TanStack Query hook that fetches nearby offers from GET /api/offers/nearby
 * and transforms the response into the NearbyOffer shape expected by
 * NearbyOffersCarousel.
 *
 * Reads lat/lng from LocationContext. Query is skipped until coordinates
 * are available.
 */

import { useQuery } from '@tanstack/react-query';
import { useCurrentLocation } from '@/hooks/useLocation';
import apiClient from '@/services/apiClient';
import type { NearbyOffer } from '@/components/discovery/NearbyOffersCarousel';

// Shape the backend is expected to return per offer item
interface RawNearbyOffer {
  _id?: string;
  id?: string;
  storeName?: string;
  merchantName?: string;
  storeId?: string;
  thumbnail?: string;
  logo?: string;
  distanceMeters?: number;
  distanceLabel?: string;
  distance?: string;
  savingsAmount?: number;
  savings?: number;
  discountAmount?: number;
  title?: string;
  description?: string;
  closingSoon?: boolean;
  slotsLeft?: number;
  urgencyLabel?: string;
}

function transformOffer(raw: RawNearbyOffer): NearbyOffer {
  // Normalise distance to a display string
  const distance: string =
    raw.distanceLabel ??
    raw.distance ??
    (raw.distanceMeters != null
      ? raw.distanceMeters < 1000
        ? `${raw.distanceMeters}m`
        : `${(raw.distanceMeters / 1000).toFixed(1)} km`
      : '');

  return {
    id: raw._id ?? raw.id ?? '',
    merchantName: raw.merchantName ?? raw.storeName ?? '',
    thumbnail: raw.thumbnail ?? raw.logo,
    distance,
    savings: raw.savingsAmount ?? raw.savings ?? raw.discountAmount ?? 0,
    description: raw.description ?? raw.title ?? '',
    closingSoon: raw.closingSoon,
    slotsLeft: raw.slotsLeft,
    urgencyLabel: raw.urgencyLabel,
  };
}

export function useNearbyOffers() {
  const { currentLocation } = useCurrentLocation();
  const lat = currentLocation?.coordinates?.latitude;
  const lng = currentLocation?.coordinates?.longitude;

  return useQuery<NearbyOffer[]>({
    queryKey: ['nearbyOffers', lat, lng] as const,
    queryFn: async () => {
      const response = await apiClient.get<RawNearbyOffer[]>('/offers/nearby', {
        lat,
        lng,
        maxDistance: 1,
        limit: 10,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Failed to fetch nearby offers');
      }

      const items = Array.isArray(response.data) ? response.data : [];
      return items.map(transformOffer);
    },
    enabled: lat != null && lng != null,
    staleTime: 60_000, // 1 min fresh
    gcTime: 5 * 60_000,
  });
}

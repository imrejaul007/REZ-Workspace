import { useApi, usePaginatedApi, useMutation, useInfiniteApi } from './useApi';
import { restaurantsApi, Restaurant, CreateRestaurantRequest, RestaurantFilters } from '../api/restaurants';

// Get restaurants with pagination
export function useRestaurants(
  filters?: RestaurantFilters,
  page: number = 1,
  limit: number = 20
) {
  return usePaginatedApi(
    (p, l) => restaurantsApi.getRestaurants(filters, p, l),
    limit
  );
}

// Get infinite scroll restaurants
export function useInfiniteRestaurants(filters?: RestaurantFilters, limit: number = 20) {
  return useInfiniteApi(
    (page, limit) => restaurantsApi.getRestaurants(filters, page, limit),
    limit
  );
}

// Get single restaurant
export function useRestaurant(id: string) {
  return useApi(() => restaurantsApi.getRestaurant(id), {
    immediate: !!id,
  });
}

// Get restaurant analytics
export function useRestaurantAnalytics(id: string, period?: '7d' | '30d' | '90d' | '1y') {
  return useApi(() => restaurantsApi.getRestaurantAnalytics(id, period), {
    immediate: !!id,
  });
}

// Get restaurant dashboard
export function useRestaurantDashboard(id: string) {
  return useApi(() => restaurantsApi.getRestaurantDashboard(id), {
    immediate: !!id,
  });
}

// Get restaurant menu
export function useRestaurantMenu(id: string) {
  return useApi(() => restaurantsApi.getRestaurantMenu(id), {
    immediate: !!id,
  });
}

// Get restaurant reviews
export function useRestaurantReviews(id: string, page: number = 1, limit: number = 10) {
  return usePaginatedApi(
    (p, l) => restaurantsApi.getRestaurantReviews(id, p, l),
    limit
  );
}

// Search restaurants
export function useRestaurantSearch(query: string, filters?: RestaurantFilters) {
  return useApi(
    () => restaurantsApi.searchRestaurants(query, filters),
    { immediate: !!query.trim() }
  );
}

// Get nearby restaurants
export function useNearbyRestaurants(
  latitude?: number,
  longitude?: number,
  radius: number = 10
) {
  return useApi(
    () => restaurantsApi.getNearbyRestaurants(latitude!, longitude!, radius),
    { immediate: !!(latitude && longitude) }
  );
}

// Mutations
export function useCreateRestaurant(options?: {
  onSuccess?: (restaurant: Restaurant) => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    (data: CreateRestaurantRequest) => restaurantsApi.createRestaurant(data),
    options
  );
}

export function useUpdateRestaurant(options?: {
  onSuccess?: (restaurant: Restaurant) => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    ({ id, data }: { id: string; data: Partial<CreateRestaurantRequest> }) =>
      restaurantsApi.updateRestaurant(id, data),
    options
  );
}

export function useDeleteRestaurant(options?: {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    (id: string) => restaurantsApi.deleteRestaurant(id),
    options
  );
}

export function useToggleRestaurantStatus(options?: {
  onSuccess?: (restaurant: Restaurant) => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      restaurantsApi.toggleRestaurantStatus(id, isActive),
    options
  );
}

export function useVerifyRestaurant(options?: {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    ({ id, documents }: { id: string; documents: File[] }) =>
      restaurantsApi.verifyRestaurant(id, documents),
    options
  );
}

export function useUploadRestaurantImages(options?: {
  onSuccess?: (urls: string[]) => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    ({ id, images }: { id: string; images: File[] }) =>
      restaurantsApi.uploadRestaurantImages(id, images),
    options
  );
}
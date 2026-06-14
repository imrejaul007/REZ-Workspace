import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rezMerchantService, Merchant, Product, Order, IndustryType } from '../services/rezMerchant';

/**
 * Hook to search merchants
 */
export function useMerchantSearch(params: {
  query?: string;
  industry?: IndustryType;
  city?: string;
}) {
  return useQuery({
    queryKey: ['merchants', 'search', params],
    queryFn: () => rezMerchantService.searchMerchants(params),
    enabled: !!params.query || !!params.industry || !!params.city,
  });
}

/**
 * Hook to get merchant by ID
 */
export function useMerchant(merchantId: string) {
  return useQuery({
    queryKey: ['merchants', merchantId],
    queryFn: () => rezMerchantService.getMerchantById(merchantId),
    enabled: !!merchantId,
  });
}

/**
 * Hook to get nearby merchants
 */
export function useNearbyMerchants(lat: number, lng: number, radiusKm = 5) {
  return useQuery({
    queryKey: ['merchants', 'nearby', lat, lng, radiusKm],
    queryFn: () => rezMerchantService.getNearbyMerchants(lat, lng, radiusKm),
    enabled: lat !== 0 && lng !== 0,
  });
}

/**
 * Hook to get featured merchants
 */
export function useFeaturedMerchants(industry?: IndustryType) {
  return useQuery({
    queryKey: ['merchants', 'featured', industry],
    queryFn: () => rezMerchantService.getFeaturedMerchants(industry),
  });
}

/**
 * Hook to get restaurant menu
 */
export function useRestaurantMenu(restaurantId: string) {
  return useQuery({
    queryKey: ['restaurant', restaurantId, 'menu'],
    queryFn: () => rezMerchantService.getRestaurantMenu(restaurantId),
    enabled: !!restaurantId,
  });
}

/**
 * Hook to get hotels
 */
export function useHotels(params?: { city?: string; checkIn?: string; checkOut?: string; guests?: number }) {
  return useQuery({
    queryKey: ['hotels', params],
    queryFn: () => rezMerchantService.getHotels(params),
  });
}

/**
 * Hook to get hotel rooms
 */
export function useHotelRooms(hotelId: string) {
  return useQuery({
    queryKey: ['hotel', hotelId, 'rooms'],
    queryFn: () => rezMerchantService.getHotelRooms(hotelId),
    enabled: !!hotelId,
  });
}

/**
 * Hook to get stores
 */
export function useStores(params?: { category?: string; city?: string }) {
  return useQuery({
    queryKey: ['stores', params],
    queryFn: () => rezMerchantService.getStores(params),
  });
}

/**
 * Hook to search products
 */
export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => rezMerchantService.searchProducts(query),
    enabled: query.length >= 2,
  });
}

/**
 * Hook to create order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: {
      merchantId: string;
      items: { productId: string; quantity: number; variant?: string }[];
      userId: string;
      deliveryAddress?: string;
      notes?: string;
    }) => rezMerchantService.createOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook to get user orders
 */
export function useUserOrders(userId: string) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => rezMerchantService.getUserOrders(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to get order status
 */
export function useOrderStatus(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => rezMerchantService.getOrderStatus(orderId),
    enabled: !!orderId,
    refetchInterval: 30000, // Poll every 30 seconds for status updates
  });
}

/**
 * Hook for merchant health check
 */
export function useMerchantHealth() {
  return useQuery({
    queryKey: ['merchant', 'health'],
    queryFn: () => rezMerchantService.healthCheck(),
    refetchInterval: 60000, // Check every minute
    retry: 3,
  });
}
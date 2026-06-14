// @ts-nocheck
/**
 * REZ Merchant Hooks
 * Integration with REZ Merchant OS for merchant discovery and management
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';

// ============================================================================
// TYPES
// ============================================================================

export type IndustryType =
  | 'restaurant'
  | 'hotel'
  | 'retail'
  | 'grocery'
  | 'salon'
  | 'healthcare'
  | 'fitness'
  | 'real_estate'
  | 'travel'
  | 'other';

export interface Merchant {
  id: string;
  name: string;
  slug?: string;
  industry: IndustryType;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  cuisine?: string[];
  amenities?: string[];
  openingHours?: Record<string, { open: string; close: string; closed?: boolean }>;
  isOpen?: boolean;
  distance?: number;
  verified?: boolean;
  featured?: boolean;
  tags?: string[];
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface MerchantSearchParams {
  query?: string;
  industry?: IndustryType;
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  priceRange?: string;
  rating?: number;
  featured?: boolean;
  verified?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'distance' | 'rating' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  image?: string;
  thumbnail?: string;
  available?: boolean;
  preparationTime?: number;
  isVeg?: boolean;
  isNonVeg?: boolean;
  isEgg?: boolean;
  spices?: number;
  allergens?: string[];
  tags?: string[];
  variants?: MenuItemVariant[];
  addons?: MenuItemAddon[];
  modifiers?: MenuItemModifier[];
}

export interface MenuItemVariant {
  id: string;
  name: string;
  price: number;
  available?: boolean;
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
  available?: boolean;
}

export interface MenuItemModifier {
  id: string;
  name: string;
  required?: boolean;
  multiSelect?: boolean;
  options: { id: string; name: string; price: number }[];
}

export interface Menu {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  categories: MenuCategory[];
  lastUpdated?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  logo?: string;
  coverImage?: string;
  cuisine?: string[];
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  deliveryTime?: number;
  minOrder?: number;
  deliveryFee?: number;
  isOpen?: boolean;
  openingHours?: Record<string, { open: string; close: string; closed?: boolean }>;
  menu?: Menu;
}

export interface Hotel {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  logo?: string;
  coverImage?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: { min: number; max: number };
  roomTypes?: RoomType[];
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  policies?: Record<string, string>;
}

export interface RoomType {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  maxOccupancy: number;
  amenities?: string[];
  images?: string[];
  available?: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

const MERCHANT_API_BASE = process.env.EXPO_PUBLIC_MERCHANT_API_URL || 'https://api.rezapp.com/merchant';

async function searchMerchantsApi(params: MerchantSearchParams): Promise<Merchant[]> {
  const response = await apiClient.get(`${MERCHANT_API_BASE}/search`, { params });
  return response.data?.merchants || response.data || [];
}

async function getMerchantByIdApi(id: string): Promise<Merchant> {
  const response = await apiClient.get(`${MERCHANT_API_BASE}/${id}`);
  return response.data;
}

async function getNearbyMerchantsApi(lat: number, lng: number, radius?: number): Promise<Merchant[]> {
  const response = await apiClient.get(`${MERCHANT_API_BASE}/nearby`, {
    params: { lat, lng, radius: radius || 10 }
  });
  return response.data?.merchants || response.data || [];
}

async function getFeaturedMerchantsApi(): Promise<Merchant[]> {
  const response = await apiClient.get(`${MERCHANT_API_BASE}/featured`);
  return response.data?.merchants || response.data || [];
}

async function searchRestaurantsApi(params: {
  query?: string;
  cuisine?: string;
  city?: string;
  rating?: number;
  priceRange?: string;
  deliveryTime?: number;
  limit?: number;
  offset?: number;
}): Promise<Restaurant[]> {
  const response = await apiClient.get(`${MERCHANT_API_BASE}/restaurants/search`, { params });
  return response.data?.restaurants || response.data || [];
}

async function getRestaurantByIdApi(id: string): Promise<Restaurant> {
  const response = await apiClient.get(`${MERCHANT_API_BASE}/restaurants/${id}`);
  return response.data;
}

async function getRestaurantMenuApi(restaurantId: string): Promise<Menu> {
  const response = await apiClient.get(`${MERCHANT_API_BASE}/restaurants/${restaurantId}/menu`);
  return response.data;
}

async function searchHotelsApi(params: {
  query?: string;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string[];
  limit?: number;
  offset?: number;
}): Promise<Hotel[]> {
  const response = await apiClient.get(`${MERCHANT_API_BASE}/hotels/search`, { params });
  return response.data?.hotels || response.data || [];
}

async function getHotelByIdApi(id: string): Promise<Hotel> {
  const response = await apiClient.get(`${MERCHANT_API_BASE}/hotels/${id}`);
  return response.data;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Search merchants with filters
 */
export function useMerchantSearch(params: MerchantSearchParams) {
  return useQuery({
    queryKey: ['merchants', 'search', params],
    queryFn: () => searchMerchantsApi(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Get single merchant by ID
 */
export function useMerchant(merchantId: string) {
  return useQuery({
    queryKey: ['merchants', merchantId],
    queryFn: () => getMerchantByIdApi(merchantId),
    enabled: !!merchantId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get nearby merchants based on location
 */
export function useNearbyMerchants(lat: number, lng: number, radius?: number) {
  return useQuery({
    queryKey: ['merchants', 'nearby', lat, lng, radius],
    queryFn: () => getNearbyMerchantsApi(lat, lng, radius),
    enabled: !!lat && !!lng,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get featured merchants
 */
export function useFeaturedMerchants() {
  return useQuery({
    queryKey: ['merchants', 'featured'],
    queryFn: getFeaturedMerchantsApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Search restaurants with filters
 */
export function useRestaurantSearch(params: {
  query?: string;
  cuisine?: string;
  city?: string;
  rating?: number;
  priceRange?: string;
  deliveryTime?: number;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['restaurants', 'search', params],
    queryFn: () => searchRestaurantsApi(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
  });
}

/**
 * Get single restaurant by ID
 */
export function useRestaurant(restaurantId: string) {
  return useQuery({
    queryKey: ['restaurants', restaurantId],
    queryFn: () => getRestaurantByIdApi(restaurantId),
    enabled: !!restaurantId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get restaurant menu
 */
export function useRestaurantMenu(restaurantId: string) {
  return useQuery({
    queryKey: ['restaurants', restaurantId, 'menu'],
    queryFn: () => getRestaurantMenuApi(restaurantId),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Search hotels with filters
 */
export function useHotelSearch(params: {
  query?: string;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string[];
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['hotels', 'search', params],
    queryFn: () => searchHotelsApi(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
  });
}

/**
 * Get single hotel by ID
 */
export function useHotel(hotelId: string) {
  return useQuery({
    queryKey: ['hotels', hotelId],
    queryFn: () => getHotelByIdApi(hotelId),
    enabled: !!hotelId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for merchant discovery with state management
 */
export function useMerchantDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('rating');

  const { data, isLoading, error, refetch } = useMerchantSearch({
    query: searchQuery || undefined,
    industry: selectedIndustry === 'all' ? undefined : selectedIndustry,
    city: selectedCity || undefined,
    sortBy,
    sortOrder: 'desc',
    limit: 50,
  });

  return {
    merchants: data || [],
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    selectedIndustry,
    setSelectedIndustry,
    selectedCity,
    setSelectedCity,
    sortBy,
    setSortBy,
  };
}

/**
 * Hook for restaurant discovery with state management
 */
export function useRestaurantDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);

  const { data, isLoading, error, refetch } = useRestaurantSearch({
    query: searchQuery || undefined,
    cuisine: selectedCuisine || undefined,
    priceRange: priceRange || undefined,
    rating: minRating > 0 ? minRating : undefined,
    limit: 50,
  });

  return {
    restaurants: data || [],
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    selectedCuisine,
    setSelectedCuisine,
    priceRange,
    setPriceRange,
    minRating,
    setMinRating,
  };
}

/**
 * Hook for hotel discovery with state management
 */
export function useHotelDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState<number>(1);
  const [rooms, setRooms] = useState<number>(1);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);

  const { data, isLoading, error, refetch } = useHotelSearch({
    query: searchQuery || undefined,
    city: selectedCity || undefined,
    checkIn: checkIn || undefined,
    checkOut: checkOut || undefined,
    guests,
    rooms,
    minPrice: minPrice > 0 ? minPrice : undefined,
    maxPrice: maxPrice > 0 ? maxPrice : undefined,
    rating: minRating > 0 ? minRating : undefined,
    limit: 50,
  });

  return {
    hotels: data || [],
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    selectedCity,
    setSelectedCity,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    guests,
    setGuests,
    rooms,
    setRooms,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    minRating,
    setMinRating,
  };
}

export default {
  useMerchantSearch,
  useMerchant,
  useNearbyMerchants,
  useFeaturedMerchants,
  useRestaurantSearch,
  useRestaurant,
  useRestaurantMenu,
  useHotelSearch,
  useHotel,
  useMerchantDiscovery,
  useRestaurantDiscovery,
  useHotelDiscovery,
};
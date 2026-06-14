// @ts-nocheck
// Habixo Filter Persistence Service
// Handles saving and loading filter preferences using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Filter persistence keys
const STORAGE_KEYS = {
  STAYS_FILTERS: '@habixo/stays/filters',
  RENT_FILTERS: '@habixo/rent/filters',
  MATCH_FILTERS: '@habixo/match/filters',
  SEARCH_HISTORY: '@habixo/search/history',
  BOOKING_PREFERENCES: '@habixo/booking/preferences',
} as const;

// Stays filter types
export interface StaysFilter {
  // Location filters
  city?: string;
  area?: string;

  // Date filters
  checkIn?: string; // ISO date string
  checkOut?: string; // ISO date string

  // Guest filters
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;

  // Property type
  propertyType?: 'entire' | 'private' | 'shared';

  // Amenities
  amenities?: string[];

  // Price range
  minPrice?: number;
  maxPrice?: number;

  // Sort options
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'newest';

  // Instant book only
  instantBook?: boolean;

  // Superhost only
  superhostOnly?: boolean;

  // Min rating
  minRating?: number;
}

// Rent filter types
export interface RentFilter {
  city?: string;
  area?: string;
  propertyType?: 'apartment' | 'house' | 'room' | 'pg';

  // Room configuration
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: 'fully' | 'semi' | 'unfurnished';

  // Budget
  minBudget?: number;
  maxBudget?: number;

  // Lease
  leaseDuration?: 'monthly' | 'yearly';
  availableFrom?: string;

  // Amenities
  amenities?: string[];

  // Pet friendly
  petFriendly?: boolean;

  // Parking
  parking?: boolean;

  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'newest';
}

// Match filter types
export interface MatchFilter {
  lookingFor?: 'roommate' | 'tenant';

  // Location
  city?: string;
  area?: string;

  // Budget
  minBudget?: number;
  maxBudget?: number;

  // Lifestyle preferences
  lifestyle?: ('early_bird' | 'night_owl' | 'quiet' | 'social' | 'fitness' | 'vegetarian')[];

  // Gender preference
  gender?: 'male' | 'female' | 'unknown';

  // Age range
  minAge?: number;
  maxAge?: number;

  // Move-in date
  moveInDate?: string;

  sortBy?: 'compatibility' | 'newest' | 'budget_low' | 'budget_high';
}

// Default filter values
export const DEFAULT_STAYS_FILTER: StaysFilter = {
  sortBy: 'relevance',
  guests: 1,
  propertyType: undefined,
  instantBook: false,
  superhostOnly: false,
  minRating: 0,
  amenities: [],
};

export const DEFAULT_RENT_FILTER: RentFilter = {
  sortBy: 'relevance',
  furnishing: 'fully',
  petFriendly: false,
  parking: false,
};

export const DEFAULT_MATCH_FILTER: MatchFilter = {
  lookingFor: 'roommate',
  gender: 'unknown',
  lifestyle: [],
};

// Save filters to storage
async function saveFilters<T>(key: string, filters: T): Promise<void> {
  try {
    const jsonValue = JSON.stringify({
      filters,
      savedAt: new Date().toISOString(),
      version: 1,
    });
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    logger.error('Error saving filters:', error);
    throw error;
  }
}

// Load filters from storage
async function loadFilters<T>(key: string, defaultFilters: T): Promise<T> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue) {
      const data = JSON.parse(jsonValue);
      return { ...defaultFilters, ...data.filters };
    }
    return defaultFilters;
  } catch (error) {
    logger.error('Error loading filters:', error);
    return defaultFilters;
  }
}

// Stays filter operations
export async function saveStaysFilters(filters: StaysFilter): Promise<void> {
  await saveFilters(STORAGE_KEYS.STAYS_FILTERS, filters);
}

export async function loadStaysFilters(): Promise<StaysFilter> {
  return loadFilters(STORAGE_KEYS.STAYS_FILTERS, DEFAULT_STAYS_FILTER);
}

// Rent filter operations
export async function saveRentFilters(filters: RentFilter): Promise<void> {
  await saveFilters(STORAGE_KEYS.RENT_FILTERS, filters);
}

export async function loadRentFilters(): Promise<RentFilter> {
  return loadFilters(STORAGE_KEYS.RENT_FILTERS, DEFAULT_RENT_FILTER);
}

// Match filter operations
export async function saveMatchFilters(filters: MatchFilter): Promise<void> {
  await saveFilters(STORAGE_KEYS.MATCH_FILTERS, filters);
}

export async function loadMatchFilters(): Promise<MatchFilter> {
  return loadFilters(STORAGE_KEYS.MATCH_FILTERS, DEFAULT_MATCH_FILTER);
}

// Search history operations
export async function addToSearchHistory(search: string): Promise<void> {
  try {
    const history = await getSearchHistory();
    const filteredHistory = history.filter(
      (s) => s.toLowerCase() !== search.toLowerCase()
    );
    const newHistory = [search, ...filteredHistory].slice(0, 20); // Keep last 20 searches
    await AsyncStorage.setItem(
      STORAGE_KEYS.SEARCH_HISTORY,
      JSON.stringify(newHistory)
    );
  } catch (error) {
    logger.error('Error adding to search history:', error);
  }
}

export async function getSearchHistory(): Promise<string[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (error) {
    logger.error('Error getting search history:', error);
    return [];
  }
}

export async function clearSearchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  } catch (error) {
    logger.error('Error clearing search history:', error);
  }
}

// Clear all filter preferences
export async function clearAllFilters(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.STAYS_FILTERS,
      STORAGE_KEYS.RENT_FILTERS,
      STORAGE_KEYS.MATCH_FILTERS,
    ]);
  } catch (error) {
    logger.error('Error clearing filters:', error);
    throw error;
  }
}

// Booking preferences
export async function saveBookingPreferences(preferences: {
  defaultGuests?: number;
  defaultPaymentMethod?: string;
  autoConfirmBookings?: boolean;
}): Promise<void> {
  await saveFilters(STORAGE_KEYS.BOOKING_PREFERENCES, preferences);
}

export async function loadBookingPreferences(): Promise<{
  defaultGuests?: number;
  defaultPaymentMethod?: string;
  autoConfirmBookings?: boolean;
}> {
  return loadFilters(STORAGE_KEYS.BOOKING_PREFERENCES, {});
}

// Get active filter count for UI badge
export function getActiveFilterCount(filters: StaysFilter): number {
  let count = 0;

  if (filters.city || filters.area) count++;
  if (filters.checkIn || filters.checkOut) count++;
  if (filters.guests && filters.guests > 1) count++;
  if (filters.bedrooms && filters.bedrooms > 0) count++;
  if (filters.propertyType) count++;
  if (filters.amenities && filters.amenities.length > 0) count++;
  if (filters.minPrice || filters.maxPrice) count++;
  if (filters.instantBook) count++;
  if (filters.superhostOnly) count++;
  if (filters.minRating && filters.minRating > 0) count++;

  return count;
}

// Serialize filter for URL
export function serializeFilterForUrl(filter: StaysFilter): string {
  const params = new URLSearchParams();

  if (filter.city) params.append('city', filter.city);
  if (filter.checkIn) params.append('checkIn', filter.checkIn);
  if (filter.checkOut) params.append('checkOut', filter.checkOut);
  if (filter.guests) params.append('guests', String(filter.guests));
  if (filter.bedrooms) params.append('bedrooms', String(filter.bedrooms));
  if (filter.propertyType) params.append('type', filter.propertyType);
  if (filter.amenities?.length) params.append('amenities', filter.amenities.join(','));
  if (filter.minPrice) params.append('minPrice', String(filter.minPrice));
  if (filter.maxPrice) params.append('maxPrice', String(filter.maxPrice));
  if (filter.sortBy) params.append('sort', filter.sortBy);
  if (filter.instantBook) params.append('instantBook', 'true');
  if (filter.superhostOnly) params.append('superhost', 'true');
  if (filter.minRating) params.append('minRating', String(filter.minRating));

  return params.toString();
}

export default {
  saveStaysFilters,
  loadStaysFilters,
  saveRentFilters,
  loadRentFilters,
  saveMatchFilters,
  loadMatchFilters,
  addToSearchHistory,
  getSearchHistory,
  clearSearchHistory,
  clearAllFilters,
  saveBookingPreferences,
  loadBookingPreferences,
  getActiveFilterCount,
  serializeFilterForUrl,
};

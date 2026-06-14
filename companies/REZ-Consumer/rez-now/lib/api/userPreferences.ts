/**
 * User Preferences API
 * Client-side API for dietary preferences and taste profiles
 */

import { authClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DietaryPreferences {
  userId: string;
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  nutFree: boolean;
  dairyFree: boolean;
  halal: boolean;
  kosher: boolean;
  jain: boolean;
  allergies: string[];
  dislikes: string[];
  preferredCuisines: string[];
  spiceTolerance: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDietaryPreferencesInput {
  vegan?: boolean;
  vegetarian?: boolean;
  glutenFree?: boolean;
  nutFree?: boolean;
  dairyFree?: boolean;
  halal?: boolean;
  kosher?: boolean;
  jain?: boolean;
  allergies?: string[];
  dislikes?: string[];
  preferredCuisines?: string[];
  spiceTolerance?: number;
}

export interface TasteProfile {
  userId: string;
  spiceTolerance: number;
  preferredCuisines: string[];
  avgOrderValue: number;
  orderingFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  preferredPortionSize: 'small' | 'medium' | 'large' | 'sharing';
  tipPercentage: number;
  dietaryRestrictions: string[];
  totalOrders: number;
  totalSpent: number;
  favoriteCategories: string[];
  favoriteItems: string[];
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTasteProfileInput {
  spiceTolerance?: number;
  preferredCuisines?: string[];
  preferredPortionSize?: 'small' | 'medium' | 'large' | 'sharing';
  tipPercentage?: number;
  dietaryRestrictions?: string[];
}

// ── Dietary Preferences API ────────────────────────────────────────────────────

/**
 * Get user's dietary preferences
 * @param userId - The user ID
 */
export async function getDietaryPreferences(userId: string): Promise<DietaryPreferences> {
  const { data } = await authClient.get(`/api/catalog/dietary-preferences/${userId}`);
  if (!data.success) throw new Error(data.message || 'Failed to get dietary preferences');
  return data.data;
}

/**
 * Update user's dietary preferences
 * @param userId - The user ID
 * @param input - The preferences to update
 */
export async function updateDietaryPreferences(
  userId: string,
  input: UpdateDietaryPreferencesInput
): Promise<DietaryPreferences> {
  const { data } = await authClient.put(`/api/catalog/dietary-preferences/${userId}`, input);
  if (!data.success) throw new Error(data.message || 'Failed to update dietary preferences');
  return data.data;
}

/**
 * Patch user's dietary preferences (partial update)
 * @param userId - The user ID
 * @param input - The preferences to update
 */
export async function patchDietaryPreferences(
  userId: string,
  input: UpdateDietaryPreferencesInput
): Promise<DietaryPreferences> {
  const { data } = await authClient.patch(`/api/catalog/dietary-preferences/${userId}`, input);
  if (!data.success) throw new Error(data.message || 'Failed to update dietary preferences');
  return data.data;
}

/**
 * Add an allergy to user's dietary preferences
 * @param userId - The user ID
 * @param allergy - The allergy to add
 */
export async function addAllergy(userId: string, allergy: string): Promise<DietaryPreferences> {
  const { data } = await authClient.post(`/api/catalog/dietary-preferences/${userId}/allergies`, {
    allergy,
  });
  if (!data.success) throw new Error(data.message || 'Failed to add allergy');
  return data.data;
}

/**
 * Remove an allergy from user's dietary preferences
 * @param userId - The user ID
 * @param allergy - The allergy to remove
 */
export async function removeAllergy(userId: string, allergy: string): Promise<DietaryPreferences> {
  const { data } = await authClient.delete(
    `/api/catalog/dietary-preferences/${userId}/allergies/${encodeURIComponent(allergy)}`
  );
  if (!data.success) throw new Error(data.message || 'Failed to remove allergy');
  return data.data;
}

/**
 * Add a dislike to user's dietary preferences
 * @param userId - The user ID
 * @param item - The item to dislike
 */
export async function addDislike(userId: string, item: string): Promise<DietaryPreferences> {
  const { data } = await authClient.post(`/api/catalog/dietary-preferences/${userId}/dislikes`, { item });
  if (!data.success) throw new Error(data.message || 'Failed to add dislike');
  return data.data;
}

// ── Taste Profile API ──────────────────────────────────────────────────────────

/**
 * Get user's taste profile
 * @param userId - The user ID
 */
export async function getTasteProfile(userId: string): Promise<TasteProfile> {
  const { data } = await authClient.get(`/api/catalog/taste-profile/${userId}`);
  if (!data.success) throw new Error(data.message || 'Failed to get taste profile');
  return data.data;
}

/**
 * Update user's taste profile
 * @param userId - The user ID
 * @param input - The profile data to update
 */
export async function updateTasteProfile(
  userId: string,
  input: UpdateTasteProfileInput
): Promise<TasteProfile> {
  const { data } = await authClient.put(`/api/catalog/taste-profile/${userId}`, input);
  if (!data.success) throw new Error(data.message || 'Failed to update taste profile');
  return data.data;
}

/**
 * Patch user's taste profile (partial update)
 * @param userId - The user ID
 * @param input - The profile data to update
 */
export async function patchTasteProfile(
  userId: string,
  input: UpdateTasteProfileInput
): Promise<TasteProfile> {
  const { data } = await authClient.patch(`/api/catalog/taste-profile/${userId}`, input);
  if (!data.success) throw new Error(data.message || 'Failed to update taste profile');
  return data.data;
}

/**
 * Submit order feedback to learn from
 * @param userId - The user ID
 * @param items - The items ordered
 * @param total - The total amount
 * @param tip - The tip amount (optional)
 */
export async function submitOrderFeedback(
  userId: string,
  items: Array<{ itemId: string; name: string; category: string; price: number }>,
  total: number,
  tip?: number
): Promise<TasteProfile> {
  const { data } = await authClient.post('/api/catalog/taste-profile/learn', {
    userId,
    items,
    total,
    tip,
  });
  if (!data.success) throw new Error(data.message || 'Failed to submit order feedback');
  return data.data;
}

// ── Weather API ────────────────────────────────────────────────────────────────

export interface WeatherData {
  locationKey: string;
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'hot' | 'cold' | 'mild';
  humidity: number;
  description: string;
  isComfortable: boolean;
}

export interface WeatherRecommendations {
  recommendedCategories: string[];
  recommendedItems: string[];
  beverages: string[];
  reason: string;
}

export interface WeatherResponse {
  weather: WeatherData;
  recommendations: WeatherRecommendations;
}

/**
 * Get weather data and food recommendations for a location
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 */
export async function getWeatherRecommendations(
  latitude: number,
  longitude: number
): Promise<WeatherResponse> {
  const { data } = await authClient.get('/api/catalog/weather', {
    params: { lat: latitude, lng: longitude },
  });
  if (!data.success) throw new Error(data.message || 'Failed to get weather data');
  return data.data;
}

// ── Utility Functions ──────────────────────────────────────────────────────────

/**
 * Get human-readable spice level description
 */
export function getSpiceLevelDescription(level: number): string {
  const descriptions = [
    'Mild',
    'Low',
    'Medium',
    'Hot',
    'Extra Hot',
  ];
  return descriptions[Math.max(0, Math.min(4, level - 1))] || 'Medium';
}

/**
 * Get human-readable portion size description
 */
export function getPortionSizeDescription(size: string): string {
  const descriptions: Record<string, string> = {
    small: 'Light snack',
    medium: 'Regular portion',
    large: 'Full meal',
    sharing: 'Family style',
  };
  return descriptions[size] || size;
}

/**
 * Get human-readable ordering frequency description
 */
export function getOrderingFrequencyDescription(frequency: string): string {
  const descriptions: Record<string, string> = {
    daily: 'Every day',
    weekly: 'A few times a week',
    monthly: 'Once a month',
    occasional: 'Special occasions',
  };
  return descriptions[frequency] || frequency;
}

/**
 * Format dietary preference summary
 */
export function formatDietarySummary(prefs: DietaryPreferences): string[] {
  const summary: string[] = [];

  if (prefs.vegan) summary.push('Vegan');
  else if (prefs.vegetarian) summary.push('Vegetarian');

  if (prefs.glutenFree) summary.push('Gluten-free');
  if (prefs.dairyFree) summary.push('Dairy-free');
  if (prefs.nutFree) summary.push('Nut-free');

  if (prefs.halal) summary.push('Halal');
  if (prefs.kosher) summary.push('Kosher');
  if (prefs.jain) summary.push('Jain');

  if (prefs.allergies.length > 0) {
    summary.push(`Allergies: ${prefs.allergies.join(', ')}`);
  }

  return summary.length > 0 ? summary : ['No restrictions'];
}

// @ts-nocheck
// Feed API Service
// Handles personalized store feed for the home screen

import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeedStore {
  storeId: string;
  storeName: string;
  logo?: string;
  category: string;
  city?: string;
  relevanceScore: number;
  activeOffer?: string;
  distance?: number;
  rating?: number;
  reviewCount?: number;
}

export interface GetPersonalizedFeedParams {
  userId?: string;
  lat?: number;
  lng?: number;
  interests?: string[];
  limit?: number;
}

export interface PersonalizedFeedResponse {
  stores: FeedStore[];
}

const INTERESTS_KEY = 'rez_interests';

/**
 * Reads the user's saved interests from AsyncStorage.
 * Returns an empty array if nothing is stored or parsing fails.
 */
export async function getUserInterests(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(INTERESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const feedApi = {
  /**
   * Fetch personalized store feed.
   * GET /api/stores/feed
   * Passes userId, location, and interests as query parameters.
   */
  async getPersonalizedFeed(params: GetPersonalizedFeedParams): Promise<FeedStore[]> {
    try {
      const query: Record<string, string | number | boolean | null | undefined> = {
        limit: params.limit ?? 20,
      };

      if (params.userId) {
        query.userId = params.userId;
      }
      if (typeof params.lat === 'number') {
        query.lat = params.lat;
      }
      if (typeof params.lng === 'number') {
        query.lng = params.lng;
      }
      if (params.interests && params.interests.length > 0) {
        query.interests = params.interests.join(',');
      }

      const response = await apiClient.get<PersonalizedFeedResponse>('/stores/feed', query);
      const data = (response as unknown)?.data?.data ?? (response as unknown)?.data ?? null;

      if (data?.stores && Array.isArray(data.stores)) {
        return data.stores;
      }

      return [];
    } catch {
      return [];
    }
  },
};

export default feedApi;

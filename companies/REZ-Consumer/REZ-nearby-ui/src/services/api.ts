'use client';

/**
 * REZ Nearby UI - API Service
 */

const API_URL = process.env.NEXT_PUBLIC_NEARBY_API_URL || 'http://localhost:3015';

export interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  distance?: number;
  rating?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

class NearbyApi {
  async getNearbyPlaces(lat: number, lng: number, category?: string): Promise<{ success: boolean; data?: { places: Place[] } }> {
    try {
      const params = new URLSearchParams({ lat: lat.toString(), lng: lng.toString() });
      if (category) params.set('category', category);
      const response = await fetch(`${API_URL}/api/places/nearby?${params}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async searchPlaces(query: string): Promise<{ success: boolean; data?: { places: Place[] } }> {
    try {
      const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async getCategories(): Promise<{ success: boolean; data?: { categories: Category[] } }> {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }
}

export const nearbyApi = new NearbyApi();

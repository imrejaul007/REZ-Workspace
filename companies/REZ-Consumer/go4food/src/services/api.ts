'use client';

/**
 * go4food - API Service
 * Connects to go4food-api backend
 */

const API_URL = process.env.NEXT_PUBLIC_GO4FOOD_API_URL || 'http://localhost:3002';

export interface Restaurant {
  id: string;
  name: string;
  cuisines: string[];
  rating: number;
  deliveryTime: number;
  priceForTwo: number;
  image: string;
  isOpen: boolean;
  isPureVeg: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  isVeg: boolean;
}

export interface SearchParams {
  query?: string;
  cuisines?: string[];
  lat?: number;
  lng?: number;
  minRating?: number;
  isPureVeg?: boolean;
  page?: number;
  limit?: number;
}

class FoodApi {
  /**
   * Search restaurants
   */
  async searchRestaurants(params: SearchParams): Promise<{ success: boolean; data?: { restaurants: Restaurant[]; total: number } }> {
    try {
      const searchParams = new URLSearchParams();
      if (params.query) searchParams.set('query', params.query);
      if (params.cuisines?.length) searchParams.set('cuisines', params.cuisines.join(','));
      if (params.lat) searchParams.set('lat', params.lat.toString());
      if (params.lng) searchParams.set('lng', params.lng.toString());
      if (params.minRating) searchParams.set('minRating', params.minRating.toString());
      if (params.isPureVeg) searchParams.set('isPureVeg', 'true');

      const response = await fetch(`${API_URL}/api/restaurants/search?${searchParams}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  /**
   * Get restaurant details
   */
  async getRestaurant(id: string): Promise<{ success: boolean; data?: Restaurant }> {
    try {
      const response = await fetch(`${API_URL}/api/restaurants/${id}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  /**
   * Get restaurant menu
   */
  async getMenu(restaurantId: string): Promise<{ success: boolean; data?: MenuItem[] }> {
    try {
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}/menu`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  /**
   * Compare prices
   */
  async comparePrice(itemName: string): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await fetch(`${API_URL}/api/compare/price?itemName=${encodeURIComponent(itemName)}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  /**
   * Find best deals
   */
  async findBestDeals(query: string): Promise<{ success: boolean; data?: any[] }> {
    try {
      const response = await fetch(`${API_URL}/api/compare/best-deals?query=${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  /**
   * Smart search
   */
  async smartSearch(q: string, params?: Partial<SearchParams>): Promise<{ success: boolean; data?: { restaurants: Restaurant[] } }> {
    try {
      const searchParams = new URLSearchParams({ q });
      if (params?.cuisines?.length) searchParams.set('cuisines', params.cuisines.join(','));
      if (params?.lat) searchParams.set('lat', params.lat.toString());

      const response = await fetch(`${API_URL}/api/search?${searchParams}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  /**
   * Get cuisines
   */
  async getCuisines(): Promise<{ success: boolean; data?: { id: string; name: string; image: string }[] }> {
    try {
      const response = await fetch(`${API_URL}/api/restaurants/cuisines/list`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }
}

export const foodApi = new FoodApi();

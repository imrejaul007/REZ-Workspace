/**
 * Waitron Client for DO App
 *
 * Connects DO App to Waitron restaurant discovery
 *
 * Flow: DO App → Waitron → Restaurant Discovery → Personalized Recommendation
 */

import axios from 'axios';

const WAITRON_URL = process.env.WAITRON_URL || 'http://localhost:4820';

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine: string[];
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  address?: string;
  locality?: string;
  isOpen?: boolean;
  deliveryAvailable?: boolean;
  averageDeliveryTime?: number;
  deliveryFee?: number;
}

export interface RestaurantRecommendation {
  restaurant: Restaurant;
  score: number;
  reasons: string[];
  matchDetails: {
    cuisineMatch: boolean;
    locationMatch: boolean;
    preferenceMatch: boolean;
    ratingMatch: boolean;
  };
}

export interface DiscoveryResult {
  success: boolean;
  recommendations: RestaurantRecommendation[];
  totalFound: number;
  personalized: boolean;
  timestamp: string;
}

export interface WeatherPrediction {
  temperature: number;
  condition: string;
  demandMultiplier: {
    delivery: number;
    dineIn: number;
    takeaway: number;
    overall: number;
  };
  recommendations: string[];
}

class WaitronClient {
  private client: axios.AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: WAITRON_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Discover restaurants based on natural language query
   * Main entry point for Genie → Restaurant discovery
   */
  async discoverRestaurants(params: {
    query: string;
    userId?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    limit?: number;
  }): Promise<DiscoveryResult> {
    try {
      const response = await this.client.get('/api/discover', {
        params: {
          query: params.query,
          userId: params.userId,
          latitude: params.latitude,
          longitude: params.longitude,
          city: params.city,
          limit: params.limit || 5
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Waitron discovery failed:', error.message);
      return {
        success: false,
        recommendations: [],
        totalFound: 0,
        personalized: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Find restaurants near a location
   */
  async findNearbyRestaurants(params: {
    latitude: number;
    longitude: number;
    limit?: number;
  }): Promise<{ success: boolean; restaurants: Restaurant[]; count: number }> {
    try {
      const response = await this.client.get('/api/restaurants/nearby', {
        params: {
          latitude: params.latitude,
          longitude: params.longitude,
          limit: params.limit || 10
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Waitron nearby failed:', error.message);
      return {
        success: false,
        restaurants: [],
        count: 0
      };
    }
  }

  /**
   * Get restaurant details
   */
  async getRestaurantDetails(restaurantId: string): Promise<Restaurant | null> {
    try {
      const response = await this.client.get(`/api/restaurants/${restaurantId}`);
      return response.data.restaurant;
    } catch (error: any) {
      console.error('Waitron restaurant details failed:', error.message);
      return null;
    }
  }

  /**
   * Process QR scan for dine-in
   */
  async processQRScan(params: {
    qrCode: string;
    customerId?: string;
    partySize?: number;
  }): Promise<{
    success: boolean;
    table?: { id: string; number: string; name: string };
    customer?: { id: string; name: string; karma: number; tier: string };
    session?: { id: string; partySize?: number };
  }> {
    try {
      const response = await this.client.post('/api/qr/scan', params);
      return response.data;
    } catch (error: any) {
      console.error('Waitron QR scan failed:', error.message);
      return { success: false };
    }
  }

  /**
   * Get weather prediction for demand forecasting
   */
  async getWeatherPrediction(): Promise<WeatherPrediction | null> {
    try {
      const response = await this.client.get('/api/twin/demo-merchant');
      return response.data.prediction?.weather || null;
    } catch (error: any) {
      console.error('Waitron weather failed:', error.message);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data?.status === 'healthy';
    } catch {
      return false;
    }
  }
}

// Export singleton
export const waitronClient = new WaitronClient();

export default WaitronClient;
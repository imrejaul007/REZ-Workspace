import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

class RezPOSClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.REZ_POS_SERVICE_URL || 'http://localhost:4013';
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        const apiKey = process.env.REZ_POS_API_KEY;
        if (apiKey) {
          config.headers['X-API-Key'] = apiKey;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('REZ POS API error', {
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Sync restaurant data with REZ POS
   */
  async syncRestaurant(data: {
    restaurantId: string;
    name: string;
    features: Record<string, boolean>;
  }): Promise<void> {
    try {
      await this.client.post('/api/internal/restaurants/sync', data);
      logger.info('Restaurant synced with REZ POS', { restaurantId: data.restaurantId });
    } catch (error) {
      logger.warn('Failed to sync restaurant with REZ POS', {
        restaurantId: data.restaurantId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Get real-time metrics from POS
   */
  async getMetrics(restaurantId: string): Promise<{
    currentCovers: number;
    pendingOrders: number;
    revenueToday: number;
    ordersToday: number;
  }> {
    try {
      const response = await this.client.get(`/api/internal/restaurants/${restaurantId}/metrics`);
      return response.data;
    } catch (error) {
      logger.warn('Failed to fetch metrics from REZ POS', { restaurantId });
      return {
        currentCovers: 0,
        pendingOrders: 0,
        revenueToday: 0,
        ordersToday: 0
      };
    }
  }

  /**
   * Get active orders count
   */
  async getActiveOrdersCount(restaurantId: string): Promise<number> {
    try {
      const response = await this.client.get(`/api/orders/active/count`, {
        params: { restaurantId }
      });
      return response.data.count || 0;
    } catch (error) {
      logger.warn('Failed to fetch active orders count', { restaurantId });
      return 0;
    }
  }

  /**
   * Check if POS is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const rezPOSClient = new RezPOSClient();

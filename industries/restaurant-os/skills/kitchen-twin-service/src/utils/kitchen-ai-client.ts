import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

class KitchenAIClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.KITCHEN_AI_SERVICE_URL || 'http://localhost:4082';
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.client.interceptors.request.use(
      (config) => {
        const apiKey = process.env.KITCHEN_AI_API_KEY;
        if (apiKey) {
          config.headers['X-API-Key'] = apiKey;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Kitchen AI API error', {
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  async predictWaitTime(station: {
    stationId: string;
    currentLoad: number;
    capacity: number;
    avgCookTime: number;
  }): Promise<number> {
    try {
      const response = await this.client.post('/api/predictions/wait-time', {
        stationId: station.stationId,
        currentLoad: station.currentLoad,
        capacity: station.capacity,
        avgCookTime: station.avgCookTime
      });
      return response.data.estimatedWaitTime || station.avgCookTime * (station.currentLoad + 1);
    } catch (error) {
      logger.warn('Failed to get AI wait time prediction', { stationId: station.stationId });
      return station.avgCookTime * (station.currentLoad + 1);
    }
  }

  async getOptimalRouting(orderId: string, items: { menuItemId: string; quantity: number }[]): Promise<{
    stationId: string;
    items: string[];
  }[]> {
    try {
      const response = await this.client.post('/api/route/order', {
        orderId,
        items
      });
      return response.data.routing;
    } catch (error) {
      logger.warn('Failed to get optimal routing from Kitchen AI', { orderId });
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const kitchenAIClient = new KitchenAIClient();

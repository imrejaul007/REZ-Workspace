import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

class RezKDSClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.REZ_KDS_SERVICE_URL || 'http://localhost:4014';
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.client.interceptors.request.use(
      (config) => {
        const apiKey = process.env.REZ_KDS_API_KEY;
        if (apiKey) config.headers['X-API-Key'] = apiKey;
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async routeOrder(orderId: string, items: { menuItemId: string; quantity: number; name: string }[]): Promise<void> {
    try {
      await this.client.post('/api/kds/orders', {
        orderId,
        items,
        timestamp: new Date().toISOString()
      });
      logger.info('Order routed to KDS', { orderId });
    } catch (error) {
      logger.warn('Failed to route order to KDS', { orderId, error: (error as Error).message });
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

export const rezKDSClient = new RezKDSClient();
import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

class RezInventoryClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.REZ_INVENTORY_SERVICE_URL || 'http://localhost:4010';
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.client.interceptors.request.use(
      (config) => {
        const apiKey = process.env.REZ_INVENTORY_API_KEY;
        if (apiKey) config.headers['X-API-Key'] = apiKey;
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async deductForOrder(orderId: string, items: { menuItemId: string; name: string; quantity: number }[]): Promise<void> {
    try {
      await this.client.post('/api/inventory/deduct', {
        orderId,
        items,
        timestamp: new Date().toISOString()
      });
      logger.info('Inventory deducted for order', { orderId });
    } catch (error) {
      logger.warn('Failed to deduct inventory', { orderId, error: (error as Error).message });
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

export const rezInventoryClient = new RezInventoryClient();
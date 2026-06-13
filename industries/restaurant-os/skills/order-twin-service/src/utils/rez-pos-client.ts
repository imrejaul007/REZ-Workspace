import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';
import { OrderStatus } from '../schemas/order-twin.schema';

class RezPOSClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.REZ_POS_SERVICE_URL || 'http://localhost:4013';
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.client.interceptors.request.use(
      (config) => {
        const apiKey = process.env.REZ_POS_API_KEY;
        if (apiKey) config.headers['X-API-Key'] = apiKey;
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      await this.client.post('/api/internal/orders/status', {
        orderId,
        status,
        timestamp: new Date().toISOString()
      });
      logger.info('Order status updated in POS', { orderId, status });
    } catch (error) {
      logger.warn('Failed to update order status in POS', { orderId, error: (error as Error).message });
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

export const rezPOSClient = new RezPOSClient();
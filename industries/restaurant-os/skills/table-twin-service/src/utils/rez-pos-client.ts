import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';
import { TableStatus } from '../schemas/table-twin.schema';

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

  async updateTableStatus(tableId: string, status: TableStatus): Promise<void> {
    try {
      await this.client.post('/api/internal/tables/status', {
        tableId,
        status,
        timestamp: new Date().toISOString()
      });
      logger.info('Table status updated in POS', { tableId, status });
    } catch (error) {
      logger.warn('Failed to update table status in POS', {
        tableId,
        error: (error as Error).message
      });
    }
  }

  async getSessionTotal(sessionId: string): Promise<{ total: number }> {
    try {
      const response = await this.client.get(`/api/sessions/${sessionId}/total`);
      return response.data;
    } catch (error) {
      logger.warn('Failed to fetch session total', { sessionId });
      return { total: 0 };
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

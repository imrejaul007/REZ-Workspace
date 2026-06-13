import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';
import { RestaurantStatus } from '../schemas/restaurant-twin.schema';

class RezDashboardClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.REZ_DASHBOARD_SERVICE_URL || 'http://localhost:4060';
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
        const apiKey = process.env.REZ_DASHBOARD_API_KEY;
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
        logger.error('REZ Dashboard API error', {
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Notify Dashboard of status change
   */
  async notifyStatusChange(restaurantId: string, status: RestaurantStatus): Promise<void> {
    try {
      await this.client.post('/api/internal/status-change', {
        restaurantId,
        status,
        timestamp: new Date().toISOString()
      });
      logger.info('Status change notified to Dashboard', { restaurantId, status });
    } catch (error) {
      logger.warn('Failed to notify Dashboard of status change', {
        restaurantId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Push real-time metrics to Dashboard
   */
  async pushMetrics(restaurantId: string, metrics: Record<string, number>): Promise<void> {
    try {
      await this.client.post(`/api/internal/restaurants/${restaurantId}/metrics`, {
        metrics,
        timestamp: new Date().toISOString()
      });
      logger.debug('Metrics pushed to Dashboard', { restaurantId });
    } catch (error) {
      logger.warn('Failed to push metrics to Dashboard', {
        restaurantId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Push alert to Dashboard
   */
  async pushAlert(restaurantId: string, alert: {
    type: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
  }): Promise<void> {
    try {
      await this.client.post(`/api/internal/restaurants/${restaurantId}/alerts`, {
        alert,
        timestamp: new Date().toISOString()
      });
      logger.info('Alert pushed to Dashboard', { restaurantId, alertType: alert.type });
    } catch (error) {
      logger.warn('Failed to push alert to Dashboard', {
        restaurantId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Check if Dashboard is available
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

export const rezDashboardClient = new RezDashboardClient();

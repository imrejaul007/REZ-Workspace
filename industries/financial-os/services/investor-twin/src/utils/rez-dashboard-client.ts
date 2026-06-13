import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

class RezDashboardClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REZ_DASHBOARD_SERVICE_URL || 'http://localhost:4060';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Notify dashboard of investor twin update
   */
  async notifyInvestorUpdate(investorId: string, event: string, data: object): Promise<void> {
    try {
      await this.client.post('/api/notifications/investor', {
        investorId,
        event,
        data,
        timestamp: new Date().toISOString()
      });
      logger.debug('Dashboard notified of investor update', { investorId, event });
    } catch (error) {
      logger.error('Failed to notify dashboard', {
        investorId,
        error: (error as Error).message
      });
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Sync investor data to dashboard
   */
  async syncInvestorData(investorId: string, twinData: object): Promise<void> {
    try {
      await this.client.post(`/api/investors/${investorId}/sync`, twinData);
      logger.debug('Investor data synced to dashboard', { investorId });
    } catch (error) {
      logger.error('Failed to sync investor data to dashboard', {
        investorId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Push real-time metrics update
   */
  async pushMetricsUpdate(investorId: string, metrics: object): Promise<void> {
    try {
      await this.client.post(`/api/investors/${investorId}/metrics`, metrics);
      logger.debug('Metrics update pushed to dashboard', { investorId });
    } catch (error) {
      logger.error('Failed to push metrics update', {
        investorId,
        error: (error as Error).message
      });
    }
  }
}

export const rezDashboardClient = new RezDashboardClient();

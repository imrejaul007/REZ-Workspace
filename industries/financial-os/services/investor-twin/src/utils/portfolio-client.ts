import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

class PortfolioClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.PORTFOLIO_SERVICE_URL || 'http://localhost:4032';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Sync portfolio data
   */
  async syncPortfolio(params: {
    investorId: string;
    holdings: Array<{
      symbol: string;
      quantity: number;
      marketValue: number;
    }>;
    totalValue: number;
  }): Promise<{ success: boolean }> {
    try {
      const response = await this.client.post('/api/portfolios/sync', params);
      logger.info('Portfolio synced', { investorId: params.investorId });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to sync portfolio', {
        investorId: params.investorId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get portfolio performance
   */
  async getPerformance(investorId: string, period: '1d' | '1w' | '1m' | '3m' | '1y' | 'all' = '1m'): Promise<{
    totalReturn: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
  }> {
    try {
      const response = await this.client.get(`/api/portfolios/${investorId}/performance`, {
        params: { period }
      });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get portfolio performance', {
        investorId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get allocation breakdown
   */
  async getAllocation(investorId: string): Promise<{
    assetAllocation: Array<{ assetClass: string; percentage: number; value: number }>;
    sectorAllocation: Array<{ sector: string; percentage: number; value: number }>;
  }> {
    try {
      const response = await this.client.get(`/api/portfolios/${investorId}/allocation`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get allocation', { investorId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Rebalance portfolio
   */
  async rebalance(investorId: string, targetAllocations: Array<{
    assetClass: string;
    targetPercentage: number;
  }>): Promise<{ trades: Array<{ symbol: string; action: string; quantity: number }> }> {
    try {
      const response = await this.client.post(`/api/portfolios/${investorId}/rebalance`, {
        targetAllocations
      });
      logger.info('Portfolio rebalance initiated', { investorId });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to rebalance portfolio', {
        investorId,
        error: (error as Error).message
      });
      throw error;
    }
  }
}

export const portfolioClient = new PortfolioClient();

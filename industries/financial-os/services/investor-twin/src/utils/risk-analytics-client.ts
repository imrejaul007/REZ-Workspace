import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

class RiskAnalyticsClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.RISK_ANALYTICS_SERVICE_URL || 'http://localhost:4033';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Calculate portfolio risk metrics
   */
  async calculateRiskMetrics(params: {
    investorId: string;
    holdings: Array<{
      symbol: string;
      weight: number;
      volatility?: number;
    }>;
  }): Promise<{
    beta: number;
    alpha: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    var95: number;
    cvar95: number;
    volatility: number;
  }> {
    try {
      const response = await this.client.post('/api/risk/calculate', params);
      logger.info('Risk metrics calculated', { investorId: params.investorId });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to calculate risk metrics', {
        investorId: params.investorId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get VaR (Value at Risk) analysis
   */
  async getVaRAnalysis(investorId: string, confidenceLevel: 95 | 99 = 95): Promise<{
    var: number;
    cvar: number;
    scenario: string;
  }> {
    try {
      const response = await this.client.get(`/api/risk/${investorId}/var`, {
        params: { confidenceLevel }
      });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get VaR analysis', { investorId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Check risk compliance
   */
  async checkCompliance(params: {
    investorId: string;
    riskTolerance: string;
    portfolioAllocations: Array<{
      assetClass: string;
      percentage: number;
    }>;
  }): Promise<{
    isCompliant: boolean;
    violations: Array<{
      assetClass: string;
      limit: number;
      current: number;
    }>;
  }> {
    try {
      const response = await this.client.post('/api/risk/compliance', params);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to check risk compliance', {
        investorId: params.investorId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get stress test results
   */
  async getStressTest(investorId: string, scenario: 'market_crash' | 'recession' | 'interest_rate_spike' | 'custom'): Promise<{
    scenario: string;
    expectedLoss: number;
    lossPercentage: number;
    recoveryTime: string;
  }> {
    try {
      const response = await this.client.get(`/api/risk/${investorId}/stress-test`, {
        params: { scenario }
      });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get stress test', { investorId, error: (error as Error).message });
      throw error;
    }
  }
}

export const riskAnalyticsClient = new RiskAnalyticsClient();

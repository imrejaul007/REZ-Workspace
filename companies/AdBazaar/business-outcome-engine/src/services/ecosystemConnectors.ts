import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { ecosystemLogger } from 'utils/logger.js';
import { ecosystemCallDuration, ecosystemCallTotal, ecosystemConnectionStatus, startTimer } from '../utils/metrics.js';

/**
 * Ecosystem Connectors
 * Connect to autonomous-growth-orchestrator (4930) and merchant-insights-os (4870)
 */

export class EcosystemConnectors {
  private orchestratorClient: AxiosInstance;
  private merchantInsightsClient: AxiosInstance;
  private hojaiClient: AxiosInstance;

  constructor() {
    // Autonomous Growth Orchestrator client
    this.orchestratorClient = axios.create({
      baseURL: config.services.autonomousGrowthOrchestrator,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.internalServiceToken,
      },
    });

    // Merchant Insights OS client
    this.merchantInsightsClient = axios.create({
      baseURL: config.services.merchantInsightsOs,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.internalServiceToken,
      },
    });

    // HOJAI AI client
    this.hojaiClient = axios.create({
      baseURL: config.services.hojaiApi,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.services.hojaiApiKey,
      },
    });

    // Add response interceptors for logging
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Orchestrator interceptor
    this.orchestratorClient.interceptors.response.use(
      response => response,
      error => {
        ecosystemLogger.error('Orchestrator API error', error.message, { service: 'orchestrator' });
        return Promise.reject(error);
      }
    );

    // Merchant Insights interceptor
    this.merchantInsightsClient.interceptors.response.use(
      response => response,
      error => {
        ecosystemLogger.error('Merchant Insights API error', error.message, { service: 'merchant_insights' });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check connection status to ecosystem services
   */
  async checkConnectionStatus(): Promise<{
    orchestrator: 'reachable' | 'unreachable';
    merchantInsights: 'reachable' | 'unreachable';
    hojai: 'reachable' | 'unreachable';
  }> {
    const results = {
      orchestrator: 'unreachable' as 'reachable' | 'unreachable',
      merchantInsights: 'unreachable' as 'reachable' | 'unreachable',
      hojai: 'unreachable' as 'reachable' | 'unreachable',
    };

    // Check orchestrator
    try {
      await this.orchestratorClient.get('/health');
      results.orchestrator = 'reachable';
      ecosystemConnectionStatus.set({ service: 'orchestrator' }, 1);
    } catch {
      ecosystemConnectionStatus.set({ service: 'orchestrator' }, 0);
    }

    // Check merchant insights
    try {
      await this.merchantInsightsClient.get('/health');
      results.merchantInsights = 'reachable';
      ecosystemConnectionStatus.set({ service: 'merchant_insights' }, 1);
    } catch {
      ecosystemConnectionStatus.set({ service: 'merchant_insights' }, 0);
    }

    // Check HOJAI
    try {
      await this.hojaiClient.get('/health');
      results.hojai = 'reachable';
      ecosystemConnectionStatus.set({ service: 'hojai' }, 1);
    } catch {
      ecosystemConnectionStatus.set({ service: 'hojai' }, 0);
    }

    return results;
  }

  // ============ Autonomous Growth Orchestrator Integration ============

  /**
   * Report outcome achievement to orchestrator
   */
  async reportOutcomeToOrchestrator(
    businessId: string,
    outcomeType: string,
    achieved: boolean,
    value: number,
    targetValue: number
  ): Promise<void> {
    const endTimer = startTimer();

    try {
      await this.orchestratorClient.post('/api/outcomes/report', {
        businessId,
        outcomeType,
        achieved,
        value,
        targetValue,
        source: 'business-outcome-engine',
        timestamp: new Date().toISOString(),
      });

      ecosystemCallTotal.inc({ service: 'orchestrator', endpoint: 'report_outcome', status: 'success' });
      ecosystemLogger.info('Outcome reported to orchestrator', { businessId, outcomeType, achieved });
    } catch (error) {
      ecosystemCallTotal.inc({ service: 'orchestrator', endpoint: 'report_outcome', status: 'error' });
      ecosystemLogger.error('Failed to report outcome to orchestrator', error, { businessId });
 } finally {
      ecosystemCallDuration.observe(
        { service: 'orchestrator', endpoint: 'report_outcome', status: 'success' },
        endTimer()
      );
    }
  }

  /**
   * Get growth campaign status from orchestrator
   */
  async getGrowthCampaignStatus(campaignId: string): Promise<any> {
    const endTimer = startTimer();

    try {
      const response = await this.orchestratorClient.get(`/api/campaigns/${campaignId}/status`);
      ecosystemCallTotal.inc({ service: 'orchestrator', endpoint: 'get_campaign_status', status: 'success' });
      return response.data;
    } catch (error) {
      ecosystemCallTotal.inc({ service: 'orchestrator', endpoint: 'get_campaign_status', status: 'error' });
      ecosystemLogger.error('Failed to get campaign status', error, { campaignId });
      throw error;
    } finally {
      ecosystemCallDuration.observe(
        { service: 'orchestrator', endpoint: 'get_campaign_status', status: 'success' },
        endTimer()
      );
    }
  }

  /**
   * Subscribe to outcome events from orchestrator
   */
  async subscribeToOutcomeEvents(
    businessId: string,
    callback: (event: any) => void
  ): Promise<void> {
    try {
      await this.orchestratorClient.post('/api/subscriptions/outcomes', {
        businessId,
        callback: 'business-outcome-engine',
        events: ['outcome.achieved', 'outcome.missed', 'outcome.at_risk'],
      });

      ecosystemLogger.info('Subscribed to outcome events', { businessId });
    } catch (error) {
      ecosystemLogger.error('Failed to subscribe to outcome events', error, { businessId });
    }
  }

  // ============ Merchant Insights OS Integration ============

  /**
   * Get merchant insights for business context
   */
  async getMerchantInsights(businessId: string): Promise<any> {
    const endTimer = startTimer();

    try {
      const response = await this.merchantInsightsClient.get(`/api/insights/${businessId}`);
      ecosystemCallTotal.inc({ service: 'merchant_insights', endpoint: 'get_insights', status: 'success' });
      return response.data;
    } catch (error) {
      ecosystemCallTotal.inc({ service: 'merchant_insights', endpoint: 'get_insights', status: 'error' });
      ecosystemLogger.error('Failed to get merchant insights', error, { businessId });
      throw error;
    } finally {
      ecosystemCallDuration.observe(
        { service: 'merchant_insights', endpoint: 'get_insights', status: 'success' },
        endTimer()
      );
    }
  }

  /**
   * Get customer analytics for LTV prediction
   */
  async getCustomerAnalytics(businessId: string): Promise<any> {
    const endTimer = startTimer();

    try {
      const response = await this.merchantInsightsClient.get(`/api/customers/analytics/${businessId}`);
      ecosystemCallTotal.inc({ service: 'merchant_insights', endpoint: 'get_customer_analytics', status: 'success' });
      return response.data;
    } catch (error) {
      ecosystemCallTotal.inc({ service: 'merchant_insights', endpoint: 'get_customer_analytics', status: 'error' });
      ecosystemLogger.error('Failed to get customer analytics', error, { businessId });
      return null; // Return null instead of throwing for non-critical integrations
    } finally {
      ecosystemCallDuration.observe(
        { service: 'merchant_insights', endpoint: 'get_customer_analytics', status: 'success' },
        endTimer()
      );
    }
  }

  /**
   * Get revenue analytics for revenue prediction
   */
  async getRevenueAnalytics(businessId: string, period: string = '90d'): Promise<any> {
    const endTimer = startTimer();

    try {
      const response = await this.merchantInsightsClient.get(`/api/revenue/analytics/${businessId}`, {
        params: { period },
      });
      ecosystemCallTotal.inc({ service: 'merchant_insights', endpoint: 'get_revenue_analytics', status: 'success' });
      return response.data;
    } catch (error) {
      ecosystemCallTotal.inc({ service: 'merchant_insights', endpoint: 'get_revenue_analytics', status: 'error' });
      ecosystemLogger.error('Failed to get revenue analytics', error, { businessId });
      return null;
    } finally {
      ecosystemCallDuration.observe(
        { service: 'merchant_insights', endpoint: 'get_revenue_analytics', status: 'success' },
        endTimer()
      );
    }
  }

  /**
   * Get churn analytics for churn prediction
   */
  async getChurnAnalytics(businessId: string): Promise<any> {
    const endTimer = startTimer();

    try {
      const response = await this.merchantInsightsClient.get(`/api/churn/analytics/${businessId}`);
      ecosystemCallTotal.inc({ service: 'merchant_insights', endpoint: 'get_churn_analytics', status: 'success' });
      return response.data;
    } catch (error) {
      ecosystemCallTotal.inc({ service: 'merchant_insights', endpoint: 'get_churn_analytics', status: 'error' });
      ecosystemLogger.error('Failed to get churn analytics', error, { businessId });
      return null;
    } finally {
      ecosystemCallDuration.observe(
        { service: 'merchant_insights', endpoint: 'get_churn_analytics', status: 'success' },
        endTimer()
      );
    }
  }

  // ============ HOJAI AI Integration ============

  /**
   * Get AI-powered insights from HOJAI
   */
  async getHojaiInsights(
    query: string,
    context: Record<string, any>
  ): Promise<any> {
    const endTimer = startTimer();

    try {
      const response = await this.hojaiClient.post('/api/query', {
        query,
        context,
        model: 'claude',
 });

      ecosystemCallTotal.inc({ service: 'hojai', endpoint: 'query', status: 'success' });
      return response.data;
    } catch (error) {
      ecosystemCallTotal.inc({ service: 'hojai', endpoint: 'query', status: 'error' });
      ecosystemLogger.error('Failed to get HOJAI insights', error, { query });
      return null;
    } finally {
      ecosystemCallDuration.observe(
        { service: 'hojai', endpoint: 'query', status: 'success' },
        endTimer()
      );
    }
  }

  /**
   * Analyze business context with HOJAI reasoning
   */
  async analyzeWithHojai(
    businessId: string,
    outcomeType: string,
    currentMetrics: Record<string, number>
  ): Promise<{
    analysis: string;
    recommendations: string[];
    confidence: number;
  } | null> {
    const endTimer = startTimer();

    try {
      const response = await this.hojaiClient.post('/api/analyze', {
        businessId,
        outcomeType,
        metrics: currentMetrics,
        analysisType: 'business_outcome',
      });

      ecosystemCallTotal.inc({ service: 'hojai', endpoint: 'analyze', status: 'success' });
      return response.data;
    } catch (error) {
      ecosystemCallTotal.inc({ service: 'hojai', endpoint: 'analyze', status: 'error' });
      ecosystemLogger.error('Failed to analyze with HOJAI', error, { businessId, outcomeType });
      return null;
    } finally {
      ecosystemCallDuration.observe(
        { service: 'hojai', endpoint: 'analyze', status: 'success' },
        endTimer()
      );
    }
  }

  /**
   * Get enriched features for prediction from HOJAI
   */
  async getEnrichedFeatures(
    businessId: string,
    baseFeatures: Record<string, number>
  ): Promise<Record<string, number>> {
    const endTimer = startTimer();

    try {
      const response = await this.hojaiClient.post('/api/enrich', {
        businessId,
        features: baseFeatures,
        enrichmentType: 'prediction',
      });

      ecosystemCallTotal.inc({ service: 'hojai', endpoint: 'enrich', status: 'success' });
      return response.data.features || baseFeatures;
    } catch (error) {
      ecosystemCallTotal.inc({ service: 'hojai', endpoint: 'enrich', status: 'error' });
      ecosystemLogger.error('Failed to enrich features', error, { businessId });
      return baseFeatures;
    } finally {
      ecosystemCallDuration.observe(
        { service: 'hojai', endpoint: 'enrich', status: 'success' },
        endTimer()
      );
    }
  }

  /**
   * Get trend analysis from HOJAI
   */
  async getTrendAnalysis(
    businessId: string,
    metric: string,
    historicalData: Array<{ date: string; value: number }>
  ): Promise<{
    trend: 'up' | 'down' | 'stable';
    strength: number;
    prediction: number;
    confidence: number;
  } | null> {
    const endTimer = startTimer();

    try {
      const response = await this.hojaiClient.post('/api/trends/analyze', {
        businessId,
        metric,
        data: historicalData,
      });

      ecosystemCallTotal.inc({ service: 'hojai', endpoint: 'trends_analyze', status: 'success' });
      return response.data;
    } catch (error) {
      ecosystemCallTotal.inc({ service: 'hojai', endpoint: 'trends_analyze', status: 'error' });
      ecosystemLogger.error('Failed to get trend analysis', error, { businessId, metric });
      return null;
    } finally {
      ecosystemCallDuration.observe(
        { service: 'hojai', endpoint: 'trends_analyze', status: 'success' },
        endTimer()
      );
    }
  }
}

// Export singleton instance
export const ecosystemConnectors = new EcosystemConnectors();
export default ecosystemConnectors;
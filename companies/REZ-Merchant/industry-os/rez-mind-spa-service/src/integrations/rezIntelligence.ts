import { config } from '../config';
import { logger } from '../utils/logger';

// REZ Intelligence Service Integration
// This module provides connectivity to other REZ intelligence services

interface IntelligenceServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

interface CustomerData {
  customerId: string;
  merchantId: string;
  email?: string;
  phone?: string;
  visitHistory?: VisitRecord[];
  preferences?: Record<string, unknown>;
}

interface VisitRecord {
  treatmentId: string;
  treatmentName: string;
  date: string;
  revenue: number;
  satisfaction?: number;
}

interface CustomerInsights {
  clv: number;
  churnRisk: 'low' | 'medium' | 'high';
  preferences: string[];
  segments: string[];
}

class RezIntelligenceService {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private isConnected: boolean = false;

  constructor() {
    // In production, these would come from config or service discovery
    this.baseUrl = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4001';
    this.timeout = parseInt(process.env.REZ_INTELLIGENCE_TIMEOUT || '5000', 10);
    this.retries = parseInt(process.env.REZ_INTELLIGENCE_RETRIES || '3', 10);
  }

  /**
   * Check connectivity to REZ Intelligence services
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health', 'GET', undefined, false);
      this.isConnected = response?.status === 'ok';
      return this.isConnected;
    } catch (error) {
      logger.warn('REZ Intelligence health check failed', { error });
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get customer data from central intelligence
   */
  async getCustomerData(customerId: string, merchantId: string): Promise<CustomerData | null> {
    try {
      const data = await this.makeRequest('/api/customers/${customerId}', 'GET', undefined);
      if (data && data.merchantId === merchantId) {
        return data;
      }
      return data;
    } catch (error) {
      logger.warn('Failed to fetch customer data from REZ Intelligence', { customerId, error });
      return null;
    }
  }

  /**
   * Get customer insights from ML models
   */
  async getCustomerInsights(customerId: string, merchantId: string): Promise<CustomerInsights | null> {
    try {
      const insights = await this.makeRequest('/api/insights/customer/${customerId}', 'GET', undefined);
      return insights;
    } catch (error) {
      logger.warn('Failed to fetch customer insights', { customerId, error });
      return null;
    }
  }

  /**
   * Get treatment effectiveness data
   */
  async getTreatmentEffectiveness(treatmentId: string): Promise<any> {
    try {
      const data = await this.makeRequest('/api/treatments/${treatmentId}/effectiveness', 'GET', undefined);
      return data;
    } catch (error) {
      logger.debug('Failed to fetch treatment effectiveness data', { treatmentId });
      return null;
    }
  }

  /**
   * Get market benchmarks
   */
  async getMarketBenchmarks(category?: string): Promise<any> {
    try {
      const endpoint = category
        ? '/api/benchmarks/market?category=${category}'
        : '/api/benchmarks/market';
      const data = await this.makeRequest(endpoint, 'GET', undefined);
      return data;
    } catch (error) {
      logger.debug('Failed to fetch market benchmarks', { error });
      return null;
    }
  }

  /**
   * Sync consultation data to central intelligence
   */
  async syncConsultationData(consultationData: {
    merchantId: string;
    customerId: string;
    recommendations: any[];
    outcome?: string;
  }): Promise<boolean> {
    try {
      await this.makeRequest('/api/consultations', 'POST', consultationData, false);
      return true;
    } catch (error) {
      logger.warn('Failed to sync consultation data', { consultationData, error });
      return false;
    }
  }

  /**
   * Get competitive intelligence
   */
  async getCompetitiveData(merchantId: string): Promise<any> {
    try {
      const data = await this.makeRequest('/api/competitive/${merchantId}', 'GET', undefined);
      return data;
    } catch (error) {
      logger.debug('Failed to fetch competitive data', { merchantId });
      return null;
    }
  }

  /**
   * Get seasonal trends from aggregated data
   */
  async getSeasonalTrends(region?: string): Promise<any> {
    try {
      const endpoint = region
        ? '/api/trends/seasonal?region=${region}'
        : '/api/trends/seasonal';
      const data = await this.makeRequest(endpoint, 'GET', undefined);
      return data;
    } catch (error) {
      logger.debug('Failed to fetch seasonal trends', { region });
      return null;
    }
  }

  /**
   * Report engagement event to analytics
   */
  async reportEvent(event: {
    eventType: string;
    merchantId: string;
    customerId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<boolean> {
    try {
      await this.makeRequest('/api/events', 'POST', event, false);
      return true;
    } catch (error) {
      // Don't log failures for analytics events
      return false;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown,
    retry: boolean = true
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < (retry ? this.retries : 1); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Service-Name': 'rez-mind-spa-service',
          'X-Internal-Token': config.internalToken,
        };

        const options: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (body && (method === 'POST' || method === 'PUT')) {
          options.body = JSON.stringify(body);
        }

        clearTimeout(timeoutId);

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof Error && error.name === 'AbortError') {
          break;
        }

        // Wait before retry
        if (attempt < (retry ? this.retries - 1 : 0)) {
          await this.delay(100 * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if service is connected
   */
  isAvailable(): boolean {
    return this.isConnected;
  }

  /**
   * Get service status
   */
  getStatus(): { connected: boolean; baseUrl: string } {
    return {
      connected: this.isConnected,
      baseUrl: this.baseUrl,
    };
  }
}

// Export singleton instance
export const rezIntelligence = new RezIntelligenceService();

export default rezIntelligence;

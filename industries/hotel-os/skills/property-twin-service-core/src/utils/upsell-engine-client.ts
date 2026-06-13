import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

interface UpsellConfig {
  enabledUpgradeTypes: string[];
  maxUpgradeDiscount: number;
  upgradeProbabilityThreshold: number;
}

class UpsellEngineClient {
  private client: AxiosInstance | null = null;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.UPSELL_ENGINE_URL || 'http://localhost:8448';
    this.apiKey = process.env.UPSELL_ENGINE_API_KEY || '';
    this.initClient();
  }

  private initClient(): void {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Upsell Engine API error', {
          error: error.message,
          status: error.response?.status
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Update property configuration
   */
  async updatePropertyConfig(propertyId: string, config: UpsellConfig): Promise<void> {
    if (!this.client) {
      logger.warn('Upsell Engine client not initialized');
      return;
    }

    try {
      await this.client.patch(`/api/properties/${propertyId}/config`, {
        upsellConfig: config,
        source: 'property-twin-service',
        timestamp: new Date().toISOString()
      });
      logger.debug('Property config updated in Upsell Engine', { propertyId });
    } catch (error) {
      logger.error('Failed to update property config in Upsell Engine', {
        propertyId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Get upsell opportunities for property
   */
  async getOpportunities(propertyId: string): Promise<{
    opportunities: Array<{
      guestId: string;
      currentRoom: string;
      upgradeTo: string;
      probability: number;
      recommendedPrice: number;
    }>;
    totalExpectedRevenue: number;
  } | null> {
    if (!this.client) {
      logger.warn('Upsell Engine client not initialized');
      return null;
    }

    try {
      const response = await this.client.get(`/api/properties/${propertyId}/opportunities`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get opportunities from Upsell Engine', {
        propertyId,
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const upsellEngineClient = new UpsellEngineClient();
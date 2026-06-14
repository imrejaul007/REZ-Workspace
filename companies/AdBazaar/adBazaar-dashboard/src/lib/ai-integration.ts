/**
 * AI Campaign Builder Integration
 *
 * Connects AdBazaar Dashboard to REZ-ai-campaign-builder service.
 *
 * Service: REZ-ai-campaign-builder (port 4009)
 * Endpoints:
 *   POST /generate           - Generate campaign from natural language goal
 *   POST /generate-creative  - Generate ad creative copy
 *   GET  /recommendations    - Get channel recommendations
 *   POST /optimize           - Optimize existing campaign
 *   GET  /templates          - Get campaign templates
 */

import { GeneratedCampaign, AdType, CampaignRequest, CreativeRequest, Estimation } from './types/ai-campaign';

// Service configuration
const AI_CAMPAIGN_BUILDER_URL = process.env.NEXT_PUBLIC_AI_CAMPAIGN_BUILDER_URL || 'http://localhost:4009';
const AI_CAMPAIGN_BUILDER_TIMEOUT = 30000; // 30 seconds

// Types for AI Campaign Builder responses
export interface AICampaignResponse {
  success: boolean;
  data?: GeneratedCampaign;
  error?: string;
}

export interface CreativeResponse {
  success: boolean;
  data?: {
    headline: string;
    body: string;
    cta: string;
  };
  error?: string;
}

export interface RecommendationsResponse {
  success: boolean;
  data?: {
    channels: Array<{
      type: AdType;
      channels: string[];
      budget: number;
    }>;
    budget: number;
    estimated: Estimation;
  };
  error?: string;
}

export interface OptimizeResponse {
  success: boolean;
  data?: {
    campaignId: string;
    suggestions: string[];
    potentialLift: string;
  };
  error?: string;
}

export interface TemplatesResponse {
  success: boolean;
  data?: Record<string, Array<{ name: string; goal: string }>>;
  error?: string;
}

// API Client class
export class AICampaignBuilderClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = AI_CAMPAIGN_BUILDER_URL, timeout: number = AI_CAMPAIGN_BUILDER_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Generate a complete campaign from natural language goal
   */
  async generateCampaign(request: CampaignRequest): Promise<AICampaignResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: request.goal,
          merchantType: request.merchantType,
          location: request.location,
          budget: request.budget,
          preferChannels: request.preferChannels,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout - AI campaign builder is taking too long',
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate ad creative copy
   */
  async generateCreative(request: CreativeRequest): Promise<CreativeResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/generate-creative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: request.goal,
          merchantType: request.merchantType,
          product: request.product,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get channel recommendations for a goal
   */
  async getRecommendations(goal: string, budget?: number): Promise<RecommendationsResponse> {
    try {
      const params = new URLSearchParams({ goal });
      if (budget) params.append('budget', budget.toString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/recommendations?${params}`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Optimize an existing campaign based on metrics
   */
  async optimizeCampaign(campaignId: string, currentMetrics?: Record<string, number>): Promise<OptimizeResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          currentMetrics,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get campaign templates by merchant type
   */
  async getTemplates(merchantType?: string): Promise<TemplatesResponse> {
    try {
      const params = merchantType ? new URLSearchParams({ type: merchantType }) : '';
      const url = `${this.baseUrl}/api/templates${params ? `?${params}` : ''}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Health check for AI Campaign Builder service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const aiCampaignBuilder = new AICampaignBuilderClient();

// React hook for campaign generation
export function useAICampaignBuilder() {
  return {
    generateCampaign: (request: CampaignRequest) => aiCampaignBuilder.generateCampaign(request),
    generateCreative: (request: CreativeRequest) => aiCampaignBuilder.generateCreative(request),
    getRecommendations: (goal: string, budget?: number) => aiCampaignBuilder.getRecommendations(goal, budget),
    optimizeCampaign: (campaignId: string, metrics?: Record<string, number>) =>
      aiCampaignBuilder.optimizeCampaign(campaignId, metrics),
    getTemplates: (merchantType?: string) => aiCampaignBuilder.getTemplates(merchantType),
    healthCheck: () => aiCampaignBuilder.healthCheck(),
  };
}

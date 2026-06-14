import { logger } from '../../shared/logger';
/**
 * Deal Service Client
 *
 * HTTP client for communicating with risna-deal-service
 * Port: 4128
 */

import axios, { AxiosInstance } from 'axios';

// Service URL from environment or default
const DEAL_SERVICE_URL = process.env.DEAL_SERVICE_URL || 'http://localhost:4128';

export interface DealFilters {
  stage?: string;
  brokerId?: string;
  minValue?: number;
  maxValue?: number;
  propertyId?: string;
  leadId?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateDealDTO {
  title: string;
  description?: string;
  value: number;
  currency?: string;
  propertyId?: string;
  leadId?: string;
  brokerId?: string;
  stage?: string;
  expectedCloseDate?: Date;
}

export interface UpdateDealDTO {
  title?: string;
  description?: string;
  value?: number;
  currency?: string;
  propertyId?: string;
  leadId?: string;
  brokerId?: string;
  stage?: string;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  aiScore?: number;
  aiRecommendation?: string;
}

export interface Deal {
  _id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  propertyId?: string;
  leadId?: string;
  brokerId?: string;
  stage: string;
  probability: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  activities: string[];
  documents: string[];
  aiScore?: number;
  aiRecommendation?: string;
  lastAIAction?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Activity {
  _id: string;
  dealId: string;
  type: string;
  title: string;
  description?: string;
  performedBy: string;
  result?: string;
  aiGenerated: boolean;
  createdAt: Date;
}

export interface PipelineStage {
  name: string;
  count: number;
  value: number;
  probability: number;
  deals: Deal[];
}

export interface PipelineView {
  stages: PipelineStage[];
  totals: {
    totalDeals: number;
    totalValue: number;
    weightedValue: number;
  };
}

export class DealClient {
  private client: AxiosInstance;

  constructor(baseUrl?: string) {
    this.client = axios.create({
      baseURL: baseUrl || DEAL_SERVICE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`[DealClient] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('[DealClient] Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Find all deals with optional filters
   */
  async findAll(filters: DealFilters = {}): Promise<Deal[]> {
    const response = await this.client.get('/deals', {
      params: {
        stage: filters.stage,
        brokerId: filters.brokerId,
        minValue: filters.minValue,
        maxValue: filters.maxValue,
        propertyId: filters.propertyId,
        leadId: filters.leadId,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc'
      }
    });
    return response.data;
  }

  /**
   * Find a single deal by ID
   */
  async findById(id: string): Promise<Deal | null> {
    try {
      const response = await this.client.get(`/deals/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new deal
   */
  async create(data: CreateDealDTO): Promise<Deal> {
    const response = await this.client.post('/deals', data);
    return response.data;
  }

  /**
   * Update an existing deal
   */
  async update(id: string, data: UpdateDealDTO): Promise<Deal> {
    const response = await this.client.put(`/deals/${id}`, data);
    return response.data;
  }

  /**
   * Delete a deal
   */
  async delete(id: string): Promise<void> {
    await this.client.delete(`/deals/${id}`);
  }

  /**
   * Move a deal to a new stage
   */
  async moveStage(id: string, stage: string, notes?: string, performedBy?: string): Promise<Deal> {
    const response = await this.client.post(`/deals/${id}/stage`, {
      stage,
      notes,
      performedBy: performedBy || 'system'
    });
    return response.data;
  }

  /**
   * Add an activity to a deal
   */
  async addActivity(dealId: string, data: Partial<Activity>): Promise<Activity> {
    const response = await this.client.post(`/deals/${dealId}/activities`, data);
    return response.data;
  }

  /**
   * Get activities for a deal
   */
  async getActivities(dealId: string, limit = 50, offset = 0): Promise<Activity[]> {
    const response = await this.client.get(`/deals/${dealId}/activities`, {
      params: { limit, offset }
    });
    return response.data;
  }

  /**
   * Get pipeline view
   */
  async getPipeline(brokerId?: string): Promise<PipelineView> {
    const response = await this.client.get('/deals/pipeline', {
      params: { brokerId }
    });
    return response.data;
  }

  /**
   * Get deal analytics
   */
  async getAnalytics(startDate?: Date, endDate?: Date, brokerId?: string): Promise<any> {
    const response = await this.client.get('/deals/analytics', {
      params: { startDate, endDate, brokerId }
    });
    return response.data;
  }

  /**
   * Attach a document to a deal
   */
  async attachDocument(dealId: string, document: {
    filename: string;
    url: string;
    type?: string;
    size?: number;
    uploadedBy?: string;
  }): Promise<any> {
    const response = await this.client.post(`/deals/${dealId}/documents`, document);
    return response.data;
  }

  /**
   * Get documents for a deal
   */
  async getDocuments(dealId: string): Promise<any[]> {
    const response = await this.client.get(`/deals/${dealId}/documents`);
    return response.data;
  }

  /**
   * Score a deal using AI
   */
  async scoreDeal(dealId: string): Promise<{ score: number; recommendation: string }> {
    const response = await this.client.post('/ai/score', { dealId });
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const dealClient = new DealClient();
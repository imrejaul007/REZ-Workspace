import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';

export interface TwinOSConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

export interface TwinCreateRequest {
  twinId: string;
  twinType: string;
  industry: string;
  attributes: Record<string, unknown>;
  relationships?: Array<{
    targetTwinId: string;
    relationshipType: string;
  }>;
  metadata?: Record<string, unknown>;
}

export interface TwinCreateResponse {
  success: boolean;
  twinId: string;
  createdAt: string;
  version: number;
}

export interface TwinUpdateRequest {
  attributes: Record<string, unknown>;
  version?: number;
}

export interface TwinResponse {
  twinId: string;
  twinType: string;
  industry: string;
  attributes: Record<string, unknown>;
  relationships: Array<{
    relationshipId: string;
    sourceTwinId: string;
    targetTwinId: string;
    relationshipType: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TwinOSError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class TwinOSClient {
  private client: AxiosInstance;
  private readonly baseUrl: string;

  constructor(config: TwinOSConfig) {
    this.baseUrl = config.baseUrl;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`TwinOS Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('TwinOS Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`TwinOS Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError<TwinOSError>) => {
        if (error.response) {
          const twinOSError: TwinOSError = {
            code: error.response.data?.code || 'UNKNOWN_ERROR',
            message: error.response.data?.message || error.message,
            details: error.response.data?.details,
          };
          logger.error('TwinOS Response Error:', twinOSError);
          return Promise.reject(twinOSError);
        }
        logger.error('TwinOS Network Error:', error.message);
        return Promise.reject({
          code: 'NETWORK_ERROR',
          message: error.message,
        });
      }
    );
  }

  /**
   * Create a new twin in TwinOS Hub
   */
  async createTwin(request: TwinCreateRequest): Promise<TwinCreateResponse> {
    const response = await this.client.post<TwinCreateResponse>('/v1/twin', request);
    return response.data;
  }

  /**
   * Get a twin by ID and type
   */
  async getTwin(twinType: string, twinId: string): Promise<TwinResponse> {
    const response = await this.client.get<TwinResponse>(`/v1/twin/${twinType}/${twinId}`);
    return response.data;
  }

  /**
   * Update twin attributes
   */
  async updateTwin(
    twinType: string,
    twinId: string,
    request: TwinUpdateRequest
  ): Promise<TwinResponse> {
    const response = await this.client.put<TwinResponse>(
      `/v1/twin/${twinType}/${twinId}`,
      request
    );
    return response.data;
  }

  /**
   * Partial update twin attributes
   */
  async patchTwin(
    twinType: string,
    twinId: string,
    attributes: Record<string, unknown>
  ): Promise<TwinResponse> {
    const response = await this.client.patch<TwinResponse>(
      `/v1/twin/${twinType}/${twinId}`,
      { attributes }
    );
    return response.data;
  }

  /**
   * Delete a twin
   */
  async deleteTwin(twinType: string, twinId: string): Promise<boolean> {
    const response = await this.client.delete<{ success: boolean }>(
      `/v1/twin/${twinType}/${twinId}`
    );
    return response.data.success;
  }

  /**
   * List twins by type
   */
  async listTwins(
    twinType: string,
    options?: {
      page?: number;
      pageSize?: number;
      industry?: string;
    }
  ): Promise<{ twins: TwinResponse[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
    if (options?.industry) params.append('industry', options.industry);

    const response = await this.client.get<{ twins: TwinResponse[]; total: number }>(
      `/v1/twin/${twinType}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Add a relationship between twins
   */
  async addRelationship(
    sourceTwinType: string,
    sourceTwinId: string,
    targetTwinType: string,
    targetTwinId: string,
    relationshipType: string
  ): Promise<{ relationshipId: string; createdAt: string }> {
    const response = await this.client.post<{ relationshipId: string; createdAt: string }>(
      `/v1/twin/${sourceTwinType}/${sourceTwinId}/relationships`,
      {
        targetTwinType,
        targetTwinId,
        relationshipType,
      }
    );
    return response.data;
  }

  /**
   * Get relationships for a twin
   */
  async getRelationships(
    twinType: string,
    twinId: string,
    relationshipType?: string
  ): Promise<Array<{
    relationshipId: string;
    sourceTwinId: string;
    targetTwinId: string;
    relationshipType: string;
    createdAt: string;
  }>> {
    const params = relationshipType ? `?relationshipType=${relationshipType}` : '';
    const response = await this.client.get<Array<{
      relationshipId: string;
      sourceTwinId: string;
      targetTwinId: string;
      relationshipType: string;
      createdAt: string;
    }>>(`/v1/twin/${twinType}/${twinId}/relationships${params}`);
    return response.data;
  }

  /**
   * Remove a relationship
   */
  async removeRelationship(
    twinType: string,
    twinId: string,
    relationshipId: string
  ): Promise<boolean> {
    const response = await this.client.delete<{ success: boolean }>(
      `/v1/twin/${twinType}/${twinId}/relationships/${relationshipId}`
    );
    return response.data.success;
  }

  /**
   * Check if TwinOS Hub is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get<{ status: string }>('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
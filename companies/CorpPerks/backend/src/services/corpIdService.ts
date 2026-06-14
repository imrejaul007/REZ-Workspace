/**
 * CorpID Service Client
 * Handles communication between CorpPerks and CorpID v2.0
 */

import { config } from '../config/index.js';

interface CorpIdLinkResponse {
  success: boolean;
  data?: {
    corpId: string;
    employeeId: string;
    linked: boolean;
    preExisting: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface CorpIdEmployeeResponse {
  success: boolean;
  data?: {
    corpId: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    managerCorpId?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface CorpIdError {
  code: string;
  message: string;
  status?: number;
}

export class CorpIdService {
  private baseUrl: string;
  private internalToken: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.corpId?.url || process.env.CORPID_SERVICE_URL || 'http://localhost:4702';
    this.internalToken = config.corpId?.internalToken || process.env.CORPID_INTERNAL_TOKEN || 'corpid-internal-token';
    this.timeout = config.corpId?.timeout || 10000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': this.internalToken,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw {
          code: data.error?.code || 'REQUEST_FAILED',
          message: data.error?.message || 'CorpID request failed',
          status: response.status,
        };
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw {
          code: 'TIMEOUT',
          message: `CorpID request timed out after ${this.timeout}ms`,
          status: 408,
        } as CorpIdError;
      }

      throw error;
    }
  }

  /**
   * Link an employee to CorpID identity
   */
  async linkEmployee(params: {
    employeeId: string;
    email: string;
    firstName: string;
    lastName: string;
    department?: string;
    designation?: string;
    managerCorpId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ corpId: string; preExisting: boolean }> {
    try {
      const response = await this.request<CorpIdLinkResponse>('/identities/link/employee', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: params.employeeId,
          email: params.email,
          firstName: params.firstName,
          lastName: params.lastName,
          department: params.department,
          designation: params.designation,
          managerCorpId: params.managerCorpId,
          metadata: params.metadata || {},
        }),
      });

      return {
        corpId: response.data!.corpId,
        preExisting: response.data!.preExisting || false,
      };
    } catch (error: any) {
      logger.error('CorpID linkEmployee error:', error);
      throw {
        code: error.code || 'CORPID_ERROR',
        message: `Failed to link employee to CorpID: ${error.message}`,
      };
    }
  }

  /**
   * Get CorpID from employee ID
   */
  async getCorpIdByEmployeeId(employeeId: string): Promise<string | null> {
    try {
      const response = await this.request<CorpIdEmployeeResponse>(
        `/identities/employee/${encodeURIComponent(employeeId)}`
      );

      return response.data?.corpId || null;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      logger.error('CorpID getCorpIdByEmployeeId error:', error);
      return null;
    }
  }

  /**
   * Get full employee data from CorpID
   */
  async getEmployeeFromCorpId(corpId: string): Promise<CorpIdEmployeeResponse['data'] | null> {
    try {
      const response = await this.request<{ success: boolean; data: any }>(
        `/identities/${encodeURIComponent(corpId)}`
      );

      return response.data || null;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      logger.error('CorpID getEmployeeFromCorpId error:', error);
      return null;
    }
  }

  /**
   * Update CorpID metadata
   */
  async updateCorpIdMetadata(
    corpId: string,
    metadata: Record<string, unknown>
  ): Promise<boolean> {
    try {
      await this.request(`/identities/${encodeURIComponent(corpId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ metadata }),
      });

      return true;
    } catch (error: any) {
      logger.error('CorpID updateCorpIdMetadata error:', error);
      return false;
    }
  }

  /**
   * Create a relationship between two CorpID entities
   */
  async createRelationship(params: {
    fromCorpId: string;
    toCorpId: string;
    type: string;
    verified?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<boolean> {
    try {
      // Use the trust-graph-service port
      const trustGraphUrl = this.baseUrl.replace(':4702', ':4706');
      await this.request(`${trustGraphUrl}/relationships`, {
        method: 'POST',
        body: JSON.stringify({
          fromCorpId: params.fromCorpId,
          toCorpId: params.toCorpId,
          type: params.type,
          verified: params.verified || false,
          metadata: params.metadata || {},
        }),
      });

      return true;
    } catch (error: any) {
      logger.error('CorpID createRelationship error:', error);
      return false;
    }
  }

  /**
   * Get relationships for a CorpID entity
   */
  async getRelationships(
    corpId: string,
    direction: 'OUTGOING' | 'INCOMING' | 'BOTH' = 'BOTH'
  ): Promise<any[]> {
    try {
      // Use the trust-graph-service port
      const trustGraphUrl = this.baseUrl.replace(':4702', ':4706');
      const response = await this.request<{ success: boolean; data: any }>(
        `/relationships/${encodeURIComponent(corpId)}?direction=${direction}`
      );

      return response.data?.items || [];
    } catch (error: any) {
      logger.error('CorpID getRelationships error:', error);
      return [];
    }
  }

  /**
   * Check if CorpID service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request<{ status: string }>('/health', { method: 'GET' });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
let corpIdServiceInstance: CorpIdService | null = null;

export function getCorpIdService(): CorpIdService {
  if (!corpIdServiceInstance) {
    corpIdServiceInstance = new CorpIdService();
  }
  return corpIdServiceInstance;
}

export default getCorpIdService;

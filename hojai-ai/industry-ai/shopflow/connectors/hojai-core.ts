/**
 * ShopFlow HOJAI Core Connector
 * Integrates ShopFlow with HOJAI AI Core Platform
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface HojaiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
}

export interface InferenceRequest {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface InferenceResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export class HojaiCoreConnector {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(config: HojaiConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:4100';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {})
      }
    });
  }

  /**
   * Health check for HOJAI Core
   */
  async health(): Promise<HealthResponse> {
    try {
      const response = await this.client.get<HealthResponse>('/health');
      return response.data;
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: 'unknown'
      };
    }
  }

  /**
   * Get AI inference from HOJAI Core
   */
  async infer(request: InferenceRequest): Promise<InferenceResponse> {
    try {
      const response = await this.client.post<{ content: string }>('/api/inference', request);
      return {
        success: true,
        content: response.data.content
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        error: axiosError.message || 'Inference failed'
      };
    }
  }

  /**
   * Get agent status from HOJAI Core
   */
  async getAgentStatus(agentId: string): Promise<{ online: boolean; lastActive?: string }> {
    try {
      const response = await this.client.get(`/api/agents/${agentId}/status`);
      return response.data;
    } catch (error) {
      return { online: false };
    }
  }

  /**
   * Send event to HOJAI Core Event Bus
   */
  async sendEvent(event: { type: string; payload: any; source: string }): Promise<boolean> {
    try {
      await this.client.post('/api/events', event);
      return true;
    } catch (error) {
      console.error('Failed to send event to HOJAI Core:', error);
      return false;
    }
  }

  /**
   * Get configuration from HOJAI Core
   */
  async getConfig(key: string): Promise<any | null> {
    try {
      const response = await this.client.get(`/api/config/${key}`);
      return response.data.value;
    } catch (error) {
      return null;
    }
  }

  /**
   * Store data in HOJAI Memory
   */
  async storeMemory(key: string, value: any): Promise<boolean> {
    try {
      await this.client.put('/api/memory', { key, value });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retrieve data from HOJAI Memory
   */
  async getMemory(key: string): Promise<any | null> {
    try {
      const response = await this.client.get(`/api/memory/${key}`);
      return response.data.value;
    } catch (error) {
      return null;
    }
  }

  /**
   * Send notification through HOJAI Communications
   */
  async sendNotification(notification: {
    channel: 'email' | 'sms' | 'whatsapp' | 'push';
    recipient: string;
    message: string;
  }): Promise<boolean> {
    try {
      await this.client.post('/api/notifications', notification);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Default instance for ShopFlow
export const createHojaiConnector = (config?: Partial<HojaiConfig>) => {
  return new HojaiCoreConnector({
    baseUrl: config?.baseUrl || process.env.HOJAI_CORE_URL || 'http://localhost:4100',
    apiKey: config?.apiKey || process.env.HOJAI_API_KEY,
    timeout: config?.timeout || 30000
  });
};

export default HojaiCoreConnector;
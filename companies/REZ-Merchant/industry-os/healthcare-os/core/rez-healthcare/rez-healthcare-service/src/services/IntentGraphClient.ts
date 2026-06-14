import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../config/logger';

export interface IntentPayload {
  userId?: string;
  intent: string;
  entities?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export class IntentGraphClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.rezMind.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.internalServiceTokens['intent-service'] || '',
        'X-Service-Name': 'rez-healthcare-service',
      },
      timeout: 10000,
    });
  }

  async trackIntent(payload: IntentPayload): Promise<void> {
    try {
      const data = {
        ...payload,
        service: 'rez-healthcare-service',
        timestamp: payload.timestamp || new Date(),
      };

      await this.client.post('/api/intents/track', data);
      logger.debug('Intent tracked', { intent: payload.intent, userId: payload.userId });
    } catch (error) {
      // Log but don't throw - intent tracking should not break main flow
      logger.warn('Failed to track intent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        intent: payload.intent,
      });
    }
  }

  async getUserIntents(
    userId: string,
    options?: {
      limit?: number;
      intentType?: string;
    }
  ): Promise<IntentPayload[]> {
    try {
      const params = new URLSearchParams({ userId });
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.intentType) params.append('intentType', options.intentType);

      const response = await this.client.get(`/api/intents/user?${params.toString()}`);
      return response.data.intents || [];
    } catch (error) {
      logger.error('Failed to get user intents', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      return [];
    }
  }

  async analyzePatientHealthPattern(patientId: string): Promise<{
    riskFactors: string[];
    recommendations: string[];
    upcomingActions: string[];
  } | null> {
    try {
      const response = await this.client.get(`/api/analysis/health-pattern/${patientId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to analyze patient health pattern', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patientId,
      });
      return null;
    }
  }
}

/**
 * AI Concierge Agent - Guest Memory Client
 * Integration client for Guest Memory service (8447)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { GuestTwin, GuestPreferences, GuestSentiment } from '../types';
import { ServiceUnavailableError } from '../utils/errors';
import { logger } from '../utils/logger';

export class GuestMemoryClient {
  private client: AxiosInstance;
  private timeout: number;

  constructor(baseUrl: string, timeout: number = 5000) {
    this.timeout = timeout;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Service': 'ai-concierge',
      },
    });
  }

  /**
   * Sync guest twin data to Guest Memory
   */
  async syncGuestTwin(twin: GuestTwin): Promise<void> {
    try {
      await this.client.post('/api/v1/twins/guest', {
        guest_id: twin.guest_id,
        profile: twin.profile,
        loyalty: twin.loyalty,
        preferences: twin.preferences,
        stay_patterns: twin.stay_patterns,
        sentiment: twin.sentiment,
        lifetime_value: twin.lifetime_value,
        current_stay: twin.current_stay,
      });

      logger.info('Guest Twin synced to Guest Memory', { guestId: twin.guest_id });
    } catch (error) {
      this.handleError('syncGuestTwin', error);
    }
  }

  /**
   * Sync preferences update to Guest Memory
   */
  async syncPreferences(guestId: string, preferences: GuestPreferences): Promise<void> {
    try {
      await this.client.patch(`/api/v1/guests/${guestId}/preferences`, {
        preferences,
        source: 'ai-concierge',
        timestamp: new Date().toISOString(),
      });

      logger.info('Preferences synced to Guest Memory', { guestId });
    } catch (error) {
      this.handleError('syncPreferences', error);
    }
  }

  /**
   * Sync sentiment update to Guest Memory / BrandPulse
   */
  async syncSentiment(guestId: string, sentiment: GuestSentiment): Promise<void> {
    try {
      await this.client.post('/api/v1/events/sentiment', {
        guest_id: guestId,
        sentiment,
        source: 'ai-concierge',
        timestamp: new Date().toISOString(),
      });

      logger.info('Sentiment synced to Guest Memory', { guestId });
    } catch (error) {
      this.handleError('syncSentiment', error);
    }
  }

  /**
   * Get guest profile from Guest Memory
   */
  async getGuestProfile(guestId: string): Promise<{
    guest_id: string;
    profile: GuestTwin['profile'];
    preferences?: GuestPreferences;
    loyalty?: GuestTwin['loyalty'];
  } | null> {
    try {
      const response = await this.client.get(`/api/v1/guests/${guestId}`);
      return response.data;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      this.handleError('getGuestProfile', error);
      return null;
    }
  }

  /**
   * Get guest preferences from Guest Memory
   */
  async getGuestPreferences(guestId: string): Promise<GuestPreferences | null> {
    try {
      const response = await this.client.get(`/api/v1/guests/${guestId}/preferences`);
      return response.data.preferences;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      this.handleError('getGuestPreferences', error);
      return null;
    }
  }

  /**
   * Get guest stay history from Guest Memory
   */
  async getStayHistory(guestId: string, limit: number = 10): Promise<{
    stays: Array<{
      check_in: string;
      check_out: string;
      property_id: string;
      room_type: string;
      total_spend: number;
    }>;
  }> {
    try {
      const response = await this.client.get(`/api/v1/guests/${guestId}/stays`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      this.handleError('getStayHistory', error);
      return { stays: [] };
    }
  }

  /**
   * Record a service interaction
   */
  async recordInteraction(
    guestId: string,
    interaction: {
      type: string;
      description: string;
      outcome: string;
      channel: string;
    }
  ): Promise<void> {
    try {
      await this.client.post(`/api/v1/guests/${guestId}/interactions`, {
        ...interaction,
        source: 'ai-concierge',
        timestamp: new Date().toISOString(),
      });

      logger.info('Interaction recorded in Guest Memory', { guestId, type: interaction.type });
    } catch (error) {
      this.handleError('recordInteraction', error);
    }
  }

  /**
   * Get lifetime value data
   */
  async getLifetimeValue(guestId: string): Promise<GuestTwin['lifetime_value'] | null> {
    try {
      const response = await this.client.get(`/api/v1/guests/${guestId}/lifetime-value`);
      return response.data;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      this.handleError('getLifetimeValue', error);
      return null;
    }
  }

  /**
   * Check health of Guest Memory service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 2000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Handle errors from Guest Memory
   */
  private handleError(operation: string, error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (this.isNotFoundError(error)) {
        logger.warn(`Guest Memory ${operation} returned not found`, {
          operation,
          status: axiosError.response?.status,
        });
        throw error;
      }

      if (axiosError.response) {
        logger.error(`Guest Memory ${operation} failed`, {
          operation,
          status: axiosError.response.status,
          data: axiosError.response.data,
        });
        throw new ServiceUnavailableError('Guest Memory', error);
      }

      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
        logger.error(`Guest Memory ${operation} connection failed`, {
          operation,
          code: axiosError.code,
        });
        throw new ServiceUnavailableError('Guest Memory', error);
      }
    }

    logger.error(`Guest Memory ${operation} failed`, {
      operation,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new ServiceUnavailableError('Guest Memory', error as Error);
  }

  /**
   * Check if error is a 404
   */
  private isNotFoundError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      return error.response?.status === 404;
    }
    return false;
  }
}

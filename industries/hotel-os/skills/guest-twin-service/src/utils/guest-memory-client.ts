import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

interface GuestProfile {
  name: string;
  email: string;
  phone: string;
  nationality?: string;
  languagePreference?: string;
  accessibilityNeeds?: string[];
}

interface GuestPreferences {
  room?: Record<string, unknown>;
  dining?: Record<string, unknown>;
  amenities?: Record<string, unknown>;
  communication?: Record<string, unknown>;
}

class GuestMemoryClient {
  private client: AxiosInstance | null = null;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.GUEST_MEMORY_URL || 'http://localhost:8447';
    this.apiKey = process.env.GUEST_MEMORY_API_KEY || '';
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
        logger.error('Guest Memory API error', {
          error: error.message,
          status: error.response?.status
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Sync guest data to Guest Memory
   */
  async syncGuest(guestId: string, data: { profile: GuestProfile; preferences?: GuestPreferences }): Promise<void> {
    if (!this.client) {
      logger.warn('Guest Memory client not initialized');
      return;
    }

    try {
      await this.client.post('/api/guests/sync', {
        guestId,
        profile: data.profile,
        preferences: data.preferences,
        source: 'guest-twin-service',
        timestamp: new Date().toISOString()
      });
      logger.debug('Guest synced to Guest Memory', { guestId });
    } catch (error) {
      logger.error('Failed to sync guest to Guest Memory', {
        guestId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Update preferences in Guest Memory
   */
  async updatePreferences(guestId: string, preferences: GuestPreferences): Promise<void> {
    if (!this.client) {
      logger.warn('Guest Memory client not initialized');
      return;
    }

    try {
      await this.client.patch(`/api/guests/${guestId}/preferences`, {
        preferences,
        source: 'guest-twin-service',
        timestamp: new Date().toISOString()
      });
      logger.debug('Preferences updated in Guest Memory', { guestId });
    } catch (error) {
      logger.error('Failed to update preferences in Guest Memory', {
        guestId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Get guest preferences from Guest Memory
   */
  async getPreferences(guestId: string): Promise<GuestPreferences | null> {
    if (!this.client) {
      logger.warn('Guest Memory client not initialized');
      return null;
    }

    try {
      const response = await this.client.get(`/api/guests/${guestId}/preferences`);
      return response.data.preferences;
    } catch (error) {
      logger.error('Failed to get preferences from Guest Memory', {
        guestId,
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Update sentiment in Guest Memory
   */
  async updateSentiment(guestId: string, score: number): Promise<void> {
    if (!this.client) {
      logger.warn('Guest Memory client not initialized');
      return;
    }

    try {
      await this.client.patch(`/api/guests/${guestId}/sentiment`, {
        score,
        source: 'guest-twin-service',
        timestamp: new Date().toISOString()
      });
      logger.debug('Sentiment updated in Guest Memory', { guestId, score });
    } catch (error) {
      logger.error('Failed to update sentiment in Guest Memory', {
        guestId,
        error: (error as Error).message
      });
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

export const guestMemoryClient = new GuestMemoryClient();
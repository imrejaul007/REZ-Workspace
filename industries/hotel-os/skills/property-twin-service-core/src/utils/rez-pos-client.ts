import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

interface Venue {
  venueId: string;
  name: string;
  type: string;
  capacity: number;
  hours?: Record<string, { open: string; close: string } | null>;
  posRevenueCenterId?: string;
  isActive?: boolean;
}

class RezPOSClient {
  private client: AxiosInstance | null = null;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.REZ_POS_URL || 'http://localhost:8449';
    this.apiKey = process.env.REZ_POS_API_KEY || '';
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
        logger.error('REZ POS API error', {
          error: error.message,
          status: error.response?.status
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Sync venue data to REZ POS
   */
  async syncVenue(propertyId: string, venue: Venue): Promise<void> {
    if (!this.client) {
      logger.warn('REZ POS client not initialized');
      return;
    }

    try {
      await this.client.post('/api/venues/sync', {
        propertyId,
        venueId: venue.venueId,
        name: venue.name,
        type: venue.type,
        capacity: venue.capacity,
        posRevenueCenterId: venue.posRevenueCenterId,
        isActive: venue.isActive ?? true,
        source: 'property-twin-service',
        timestamp: new Date().toISOString()
      });
      logger.debug('Venue synced to REZ POS', { propertyId, venueId: venue.venueId });
    } catch (error) {
      logger.error('Failed to sync venue to REZ POS', {
        propertyId,
        venueId: venue.venueId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Get revenue center for venue
   */
  async getRevenueCenter(venueId: string): Promise<{
    revenueCenterId: string;
    name: string;
    type: string;
  } | null> {
    if (!this.client) {
      logger.warn('REZ POS client not initialized');
      return null;
    }

    try {
      const response = await this.client.get(`/api/venues/${venueId}/revenue-center`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get revenue center from REZ POS', {
        venueId,
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

export const rezPOSClient = new RezPOSClient();
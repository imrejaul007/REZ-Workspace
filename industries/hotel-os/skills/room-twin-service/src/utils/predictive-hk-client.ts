import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

class PredictiveHKClient {
  private client: AxiosInstance | null = null;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.PREDICTIVE_HK_URL || 'http://localhost:8446';
    this.apiKey = process.env.PREDICTIVE_HK_API_KEY || '';
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
        logger.error('Predictive Housekeeping API error', {
          error: error.message,
          status: error.response?.status
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Sync room data to Predictive Housekeeping
   */
  async syncRoom(roomId: string, data: {
    propertyId: string;
    roomType: string;
    floor: number;
  }): Promise<void> {
    if (!this.client) {
      logger.warn('Predictive Housekeeping client not initialized');
      return;
    }

    try {
      await this.client.post('/api/rooms/sync', {
        roomId,
        ...data,
        source: 'room-twin-service',
        timestamp: new Date().toISOString()
      });
      logger.debug('Room synced to Predictive Housekeeping', { roomId });
    } catch (error) {
      logger.error('Failed to sync room to Predictive Housekeeping', {
        roomId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Update room status in Predictive Housekeeping
   */
  async updateRoomStatus(roomId: string, status: string): Promise<void> {
    if (!this.client) {
      logger.warn('Predictive Housekeeping client not initialized');
      return;
    }

    try {
      await this.client.patch(`/api/rooms/${roomId}/status`, {
        status,
        source: 'room-twin-service',
        timestamp: new Date().toISOString()
      });
      logger.debug('Room status updated in Predictive Housekeeping', { roomId, status });
    } catch (error) {
      logger.error('Failed to update room status in Predictive Housekeeping', {
        roomId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Get cleaning schedule for a room
   */
  async getCleaningSchedule(roomId: string): Promise<{
    lastCleaned: string;
    nextScheduled: string;
    priority: 'low' | 'medium' | 'high';
  } | null> {
    if (!this.client) {
      logger.warn('Predictive Housekeeping client not initialized');
      return null;
    }

    try {
      const response = await this.client.get(`/api/rooms/${roomId}/schedule`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get cleaning schedule from Predictive Housekeeping', {
        roomId,
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

export const predictiveHKClient = new PredictiveHKClient();
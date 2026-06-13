import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

class BrandPulseClient {
  private client: AxiosInstance | null = null;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.BRANDPULSE_URL || 'http://localhost:8451';
    this.apiKey = process.env.BRANDPULSE_API_KEY || '';
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
        logger.error('BrandPulse API error', {
          error: error.message,
          status: error.response?.status
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Update guest sentiment score
   */
  async updateSentiment(guestId: string, score: number): Promise<void> {
    if (!this.client) {
      logger.warn('BrandPulse client not initialized');
      return;
    }

    try {
      await this.client.post('/api/sentiment/guest', {
        guestId,
        score,
        source: 'guest-twin-service',
        timestamp: new Date().toISOString()
      });
      logger.debug('Sentiment sent to BrandPulse', { guestId, score });
    } catch (error) {
      logger.error('Failed to send sentiment to BrandPulse', {
        guestId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Get sentiment trends for a guest
   */
  async getSentimentTrends(guestId: string, days: number = 30): Promise<{
    currentScore: number;
    averageScore: number;
    trend: 'improving' | 'stable' | 'declining';
    dataPoints: Array<{ date: string; score: number }>;
  } | null> {
    if (!this.client) {
      logger.warn('BrandPulse client not initialized');
      return null;
    }

    try {
      const response = await this.client.get(`/api/sentiment/guest/${guestId}/trends`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to get sentiment trends from BrandPulse', {
        guestId,
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Submit guest feedback
   */
  async submitFeedback(guestId: string, feedback: {
    rating: number;
    comment?: string;
    categories?: string[];
  }): Promise<void> {
    if (!this.client) {
      logger.warn('BrandPulse client not initialized');
      return;
    }

    try {
      await this.client.post('/api/feedback', {
        guestId,
        ...feedback,
        source: 'guest-twin-service',
        timestamp: new Date().toISOString()
      });
      logger.debug('Feedback submitted to BrandPulse', { guestId });
    } catch (error) {
      logger.error('Failed to submit feedback to BrandPulse', {
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

export const brandPulseClient = new BrandPulseClient();
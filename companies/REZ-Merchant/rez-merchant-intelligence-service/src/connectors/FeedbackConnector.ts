import axios, { AxiosInstance } from 'axios';
import config from '../config';
import { logger } from '../utils/logger';

interface Feedback {
  id: string;
  merchantId: string;
  customerId: string;
  type: 'rating' | 'review' | 'complaint';
  rating?: number;
  comment?: string;
  createdAt: string;
  responded: boolean;
}

interface FeedbackSummary {
  totalFeedback: number;
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  responseRate: number;
  responseTime?: number; // in hours
}

interface CustomerFeedbackStats {
  customerId: string;
  totalFeedback: number;
  averageRating: number;
  lastFeedbackDate: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export class FeedbackConnector {
  private client: AxiosInstance;
  private cache: Map<string, { data; timestamp: number }> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.client = axios.create({
      baseURL: config.services.feedback,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Fetch feedback for a merchant
   */
  async getMerchantFeedback(
    merchantId: string,
    options: { type?: string; limit?: number; startDate?: string; endDate?: string } = {}
  ): Promise<Feedback[]> {
    const cacheKey = `feedback:${merchantId}:${JSON.stringify(options)}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const response = await this.client.get(`/merchants/${merchantId}/feedback`, {
        params: options,
      });

      const feedback = response.data.data || [];
      this.setCache(cacheKey, feedback);
      return feedback;
    } catch (error) {
      logger.error(`Failed to fetch feedback for merchant ${merchantId}`, error);
      return this.getMockFeedback(merchantId);
    }
  }

  /**
   * Get feedback summary
   */
  async getFeedbackSummary(merchantId: string): Promise<FeedbackSummary> {
    const feedback = await this.getMerchantFeedback(merchantId);

    const ratings = feedback.filter(f => f.rating !== undefined).map(f => f.rating!);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    const positiveCount = ratings.filter(r => r >= 4).length;
    const negativeCount = ratings.filter(r => r <= 2).length;
    const neutralCount = ratings.filter(r => r === 3).length;
    const respondedCount = feedback.filter(f => f.responded).length;
    const responseRate = feedback.length > 0 ? respondedCount / feedback.length : 0;

    return {
      totalFeedback: feedback.length,
      averageRating: Math.round(avgRating * 10) / 10,
      positiveCount,
      negativeCount,
      neutralCount,
      responseRate: Math.round(responseRate * 100) / 100,
    };
  }

  /**
   * Get customer feedback statistics
   */
  async getCustomerFeedbackStats(merchantId: string): Promise<CustomerFeedbackStats[]> {
    const feedback = await this.getMerchantFeedback(merchantId);
    const customerMap = new Map<string, CustomerFeedbackStats>();

    feedback.forEach(f => {
      const existing = customerMap.get(f.customerId);
      const rating = f.rating || 0;

      if (existing) {
        existing.totalFeedback++;
        existing.averageRating = (existing.averageRating * (existing.totalFeedback - 1) + rating) / existing.totalFeedback;
        if (f.createdAt > existing.lastFeedbackDate) {
          existing.lastFeedbackDate = f.createdAt;
        }
      } else {
        customerMap.set(f.customerId, {
          customerId: f.customerId,
          totalFeedback: 1,
          averageRating: rating,
          lastFeedbackDate: f.createdAt,
          sentiment: rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral',
        });
      }
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.totalFeedback - a.totalFeedback);
  }

  /**
   * Get feedback trends over time
   */
  async getFeedbackTrends(merchantId: string, days: number = 30): Promise<unknown[]> {
    const feedback = await this.getMerchantFeedback(merchantId);
    const trendMap = new Map<string, { count: number; totalRating: number; positive: number; negative: number }>();

    // Initialize all days
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      trendMap.set(dateStr, { count: 0, totalRating: 0, positive: 0, negative: 0 });
    }

    // Aggregate feedback
    feedback.forEach(f => {
      const dateStr = f.createdAt.split('T')[0];
      if (trendMap.has(dateStr)) {
        const current = trendMap.get(dateStr)!;
        current.count++;
        if (f.rating !== undefined) {
          current.totalRating += f.rating;
          if (f.rating >= 4) current.positive++;
          if (f.rating <= 2) current.negative++;
        }
      }
    });

    return Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        feedbackCount: data.count,
        averageRating: data.count > 0 ? Math.round((data.totalRating / data.count) * 10) / 10 : 0,
        positivePercentage: data.count > 0 ? Math.round((data.positive / data.count) * 100) : 0,
        negativePercentage: data.count > 0 ? Math.round((data.negative / data.count) * 100) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get recent complaints
   */
  async getRecentComplaints(merchantId: string, limit: number = 10): Promise<Feedback[]> {
    const feedback = await this.getMerchantFeedback(merchantId);

    return feedback
      .filter(f => f.type === 'complaint' || (f.rating !== undefined && f.rating <= 2))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get feedback by category
   */
  async getFeedbackByCategory(merchantId: string): Promise<unknown> {
    const feedback = await this.getMerchantFeedback(merchantId);

    const categories = {
      service: 0,
      product: 0,
      delivery: 0,
      price: 0,
      other: 0,
    };

    feedback.forEach(f => {
      if (f.comment) {
        const comment = f.comment.toLowerCase();
        if (comment.includes('service') || comment.includes('staff')) categories.service++;
        else if (comment.includes('product') || comment.includes('food')) categories.product++;
        else if (comment.includes('delivery') || comment.includes('wait')) categories.delivery++;
        else if (comment.includes('price') || comment.includes('expensive')) categories.price++;
        else categories.other++;
      } else {
        categories.other++;
      }
    });

    return categories;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached !== undefined && Date.now() - cached.timestamp < this.cacheTimeout;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get mock feedback for development
   */
  private getMockFeedback(merchantId: string): Feedback[] {
    const feedback: Feedback[] = [];
    const now = new Date();
    const comments = [
      'Great food and service!',
      'Delivery was a bit slow',
      'Amazing experience!',
      'Food quality could be better',
      'Love this place!',
      'Portions are too small',
      'Best restaurant in town!',
      'Prices are too high',
      'Friendly staff',
      'Will come again!',
    ];

    for (let i = 0; i < 100; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      feedback.push({
        id: `feedback-${i}`,
        merchantId,
        customerId: `customer-${Math.floor(Math.random() * 50)}`,
        type: Math.random() > 0.9 ? 'complaint' : Math.random() > 0.3 ? 'rating' : 'review',
        rating: Math.floor(Math.random() * 5) + 1,
        comment: comments[Math.floor(Math.random() * comments.length)],
        createdAt: date.toISOString(),
        responded: Math.random() > 0.5,
      });
    }

    return feedback;
  }
}

export const feedbackConnector = new FeedbackConnector();
export default feedbackConnector;

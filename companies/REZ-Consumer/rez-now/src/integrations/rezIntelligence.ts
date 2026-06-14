/**
 * REZ Intelligence Integration for ReZ Now
 *
 * This module provides AI-powered features for the merchant platform:
 * - Product recommendations
 * - User intent prediction
 * - Churn prevention
 * - Personalized experiences
 */

import axios from 'axios';

// REZ Intelligence Service URLs
const INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018';

// Types
interface IntentPrediction {
  userId: string;
  intents: { intent: string; confidence: number }[];
  primaryIntent: string;
  confidence: number;
}

interface ProductRecommendation {
  productId: string;
  name: string;
  score: number;
  reason: string;
}

interface ChurnPrediction {
  userId: string;
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  probability: number;
  recommendations: { action: string; priority: number }[];
}

interface LTVPrediction {
  customerId: string;
  predictedLTV: number;
  confidence: number;
}

// Client
class REZIntelligenceClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = INTELLIGENCE_URL;
    this.apiKey = process.env.REZ_INTELLIGENCE_API_KEY || '';
  }

  private async post<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    const response = await axios.post(`${this.baseUrl}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      timeout: 10000,
    });
    return response.data;
  }

  /**
   * Predict user intent based on behavior
   */
  async predictIntent(userId: string, context?: Record<string, unknown>): Promise<IntentPrediction> {
    try {
      return await this.post('/api/intent/predict', { userId, context });
    } catch (error) {
      console.error('Intent prediction failed:', error);
      return {
        userId,
        intents: [],
        primaryIntent: 'unknown',
        confidence: 0,
      };
    }
  }

  /**
   * Get personalized product recommendations
   */
  async getRecommendations(userId: string, limit = 10): Promise<ProductRecommendation[]> {
    try {
      const response = await this.post<{ products: ProductRecommendation[] }>('/api/recommend/products', {
        userId,
        limit,
      });
      return response.products;
    } catch (error) {
      console.error('Product recommendations failed:', error);
      return [];
    }
  }

  /**
   * Predict churn risk
   */
  async predictChurn(userId: string): Promise<ChurnPrediction> {
    try {
      return await this.post('/api/predict/churn', { userId });
    } catch (error) {
      console.error('Churn prediction failed:', error);
      return {
        userId,
        riskLevel: 'medium',
        probability: 0.5,
        recommendations: [],
      };
    }
  }

  /**
   * Predict customer lifetime value
   */
  async predictLTV(userId: string): Promise<LTVPrediction> {
    try {
      return await this.post('/api/predict/ltv', { userId });
    } catch (error) {
      console.error('LTV prediction failed:', error);
      return {
        customerId: userId,
        predictedLTV: 0,
        confidence: 0,
      };
    }
  }

  /**
   * Get user segments
   */
  async getUserSegments(userId: string): Promise<string[]> {
    try {
      const response = await this.post<{ segments: string[] }>('/api/segments/user', { userId });
      return response.segments;
    } catch (error) {
      console.error('Get segments failed:', error);
      return [];
    }
  }
}

export const rezIntelligence = new REZIntelligenceClient();
export default rezIntelligence;

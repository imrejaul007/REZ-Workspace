/**
 * HOJAI Core Connector
 * Connects TRIPMIND to HOJAI Core AI infrastructure
 */

export interface HOJAIConfig {
  baseUrl: string;
  apiKey: string;
}

export class HOJAIConnector {
  private config: HOJAIConfig;

  constructor(config: HOJAIConfig) {
    this.config = config;
  }

  async analyzeIntent(text: string, context?: { customerId?: string; destination?: string }): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, unknown>;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/intent/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text, context })
        }
      );

      if (!response.ok) {
        return { intent: 'unknown', confidence: 0, entities: {} };
      }

      return await response.json();
    } catch {
      return { intent: 'unknown', confidence: 0, entities: {} };
    }
  }

  async getTravelRecommendations(destination: string, preferences: string[]): Promise<{
    attractions: { name: string; description: string; rating: number }[];
    restaurants: { name: string; cuisine: string; priceRange: string }[];
    tips: string[];
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/travel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ destination, preferences })
        }
      );

      if (!response.ok) {
        return {
          attractions: [
            { name: 'Local Museum', description: 'Historical artifacts', rating: 4.5 },
            { name: 'City Park', description: 'Beautiful gardens', rating: 4.3 }
          ],
          restaurants: [
            { name: 'Local Kitchen', cuisine: 'Indian', priceRange: '₹500-1000' },
            { name: 'Cafe Central', cuisine: 'Continental', priceRange: '₹800-1500' }
          ],
          tips: ['Book attractions in advance', 'Try local street food']
        };
      }

      return await response.json();
    } catch {
      return {
        attractions: [],
        restaurants: [],
        tips: []
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default HOJAIConnector;
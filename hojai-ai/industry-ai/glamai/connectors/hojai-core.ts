/**
 * HOJAI Core Connector
 * Connects GLAMAI to HOJAI Core AI infrastructure
 * Beauty and Salon AI Recommendations
 */

export interface HOJAIConfig {
  baseUrl: string;
  apiKey: string;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
}

export interface BeautyContext {
  customerId?: string;
  skinType?: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';
  hairType?: 'straight' | 'wavy' | 'curly' | 'coily';
  concerns?: string[];
  allergies?: string[];
}

export interface SkinAnalysis {
  skinType: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';
  hydrationLevel: number;
  concerns: string[];
  recommendations: string[];
  productSuggestions: string[];
}

export interface HairAnalysis {
  hairType: 'straight' | 'wavy' | 'curly' | 'coily';
  porosity: 'low' | 'medium' | 'high';
  thickness: 'fine' | 'medium' | 'coarse';
  concerns: string[];
  recommendations: string[];
  productSuggestions: string[];
}

export interface LookRecommendation {
  name: string;
  description: string;
  products: string[];
  steps: string[];
  occasion: 'casual' | 'work' | 'party' | 'wedding' | 'everyday';
  estimatedTime: number;
}

export class HOJAIConnector {
  private config: HOJAIConfig;

  constructor(config: HOJAIConfig) {
    this.config = config;
  }

  /**
   * Analyze beauty intent from text
   */
  async analyzeIntent(
    text: string,
    context?: BeautyContext
  ): Promise<IntentResult> {
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

  /**
   * Analyze skin condition
   */
  async analyzeSkin(
    customerId: string,
    description?: string
  ): Promise<SkinAnalysis | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/beauty/skin-analysis/${customerId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ description })
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Analyze hair condition
   */
  async analyzeHair(
    customerId: string,
    description?: string
  ): Promise<HairAnalysis | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/beauty/hair-analysis/${customerId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ description })
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Get personalized look recommendation
   */
  async getLookRecommendation(
    customerId: string,
    occasion?: 'casual' | 'work' | 'party' | 'wedding' | 'everyday'
  ): Promise<LookRecommendation | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/look/${customerId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ occasion })
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Get product recommendations
   */
  async getProductRecommendations(
    customerId: string,
    category: 'skincare' | 'haircare' | 'makeup' | 'nailcare'
  ): Promise<{ products: string[]; reasons: string[] }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/products/${customerId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ category })
        }
      );

      if (!response.ok) {
        return { products: [], reasons: [] };
      }

      return await response.json();
    } catch {
      return { products: [], reasons: [] };
    }
  }

  /**
   * Generate skincare routine
   */
  async generateSkincareRoutine(
    customerName: string,
    skinType: string,
    concerns: string[]
  ): Promise<{
    morning: string[];
    evening: string[];
    weekly: string[];
    tips: string[];
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/narrative/skincare-routine`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ customerName, skinType, concerns })
        }
      );

      if (!response.ok) {
        return { morning: [], evening: [], weekly: [], tips: [] };
      }

      return await response.json();
    } catch {
      return { morning: [], evening: [], weekly: [], tips: [] };
    }
  }

  /**
   * Generate hairstyling tips
   */
  async getHairstylingTips(
    customerName: string,
    hairType: string,
    length: 'short' | 'medium' | 'long'
  ): Promise<{ tips: string[]; avoid: string[]; recommendedStyles: string[] }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/beauty/hairstyling-tips`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ customerName, hairType, length })
        }
      );

      if (!response.ok) {
        return { tips: [], avoid: [], recommendedStyles: [] };
      }

      return await response.json();
    } catch {
      return { tips: [], avoid: [], recommendedStyles: [] };
    }
  }

  /**
   * Get color recommendations
   */
  async getColorRecommendations(
    customerId: string,
    type: 'hair' | 'makeup' | 'nail'
  ): Promise<{ colors: string[]; reasoning: string[] }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/beauty/color-recommendations/${customerId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type })
        }
      );

      if (!response.ok) {
        return { colors: [], reasoning: [] };
      }

      return await response.json();
    } catch {
      return { colors: [], reasoning: [] };
    }
  }

  /**
   * Get customer memory/preferences
   */
  async getMemory(
    customerId: string,
    key?: string
  ): Promise<{ key: string; value: unknown } | { key: string; value: unknown }[] | null> {
    try {
      const url = key
        ? `${this.config.baseUrl}/api/memory/${customerId}/${key}`
        : `${this.config.baseUrl}/api/memory/${customerId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Store customer memory/preferences
   */
  async setMemory(
    customerId: string,
    data: { key: string; value: unknown; ttl?: number }
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/memory/${customerId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get AI agent response
   */
  async getAgentResponse(
    agentId: string,
    message: string,
    context?: BeautyContext
  ): Promise<{ response: string; actions?: unknown[] } | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/agents/${agentId}/chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message, context })
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Check connectivity
   */
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
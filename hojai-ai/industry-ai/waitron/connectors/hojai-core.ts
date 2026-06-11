/**
 * HOJAI Core Connector
 * Connects WAITRON to HOJAI Core AI infrastructure
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

export interface MemoryData {
  key: string;
  value: unknown;
  ttl?: number;
}

export interface TrustScore {
  score: number;
  factors: string[];
  lastUpdated: string;
}

export class HOJAIConnector {
  private config: HOJAIConfig;

  constructor(config: HOJAIConfig) {
    this.config = config;
  }

  /**
   * Analyze user intent from text
   */
  async analyzeIntent(text: string, context?: Record<string, unknown>): Promise<IntentResult> {
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
   * Get user memory/preferences
   */
  async getMemory(userId: string, key?: string): Promise<MemoryData | MemoryData[] | null> {
    try {
      const url = key
        ? `${this.config.baseUrl}/api/memory/${userId}/${key}`
        : `${this.config.baseUrl}/api/memory/${userId}`;

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
   * Store user memory/preferences
   */
  async setMemory(userId: string, data: MemoryData): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/memory/${userId}`,
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
   * Get trust score for user/entity
   */
  async getTrustScore(entityType: string, entityId: string): Promise<TrustScore | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/trust/${entityType}/${entityId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Get AI agent response
   */
  async getAgentResponse(
    agentId: string,
    message: string,
    context?: Record<string, unknown>
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
   * Generate personalized recommendation
   */
  async getRecommendation(
    userId: string,
    type: 'food' | 'menu' | 'combo'
  ): Promise<unknown[] | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/${userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type })
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

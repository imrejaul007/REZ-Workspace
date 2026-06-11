/**
 * HOJAI Core Connector
 * Connects STAYBOT to HOJAI Core AI infrastructure
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

export interface GuestPreferences {
  preferredRoomType?: string;
  dietaryRestrictions?: string[];
  preferredFloors?: string[];
  pillowType?: string;
  checkInTime?: string;
  specialOccasions?: string[];
  notes?: string;
}

export interface HotelContext {
  guestId?: string;
  bookingId?: string;
  roomNumber?: string;
  stayPurpose?: 'business' | 'leisure' | 'wedding' | 'other';
  specialOccasion?: string;
  loyaltyTier?: string;
}

export class HOJAIConnector {
  private config: HOJAIConfig;

  constructor(config: HOJAIConfig) {
    this.config = config;
  }

  /**
   * Analyze guest intent from text
   */
  async analyzeIntent(
    text: string,
    context?: Record<string, unknown>
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
   * Get guest memory/preferences
   */
  async getMemory(
    guestId: string,
    key?: string
  ): Promise<MemoryData | MemoryData[] | null> {
    try {
      const url = key
        ? `${this.config.baseUrl}/api/memory/${guestId}/${key}`
        : `${this.config.baseUrl}/api/memory/${guestId}`;

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
   * Store guest memory/preferences
   */
  async setMemory(guestId: string, data: MemoryData): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/memory/${guestId}`,
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
   * Get guest preferences from memory
   */
  async getGuestPreferences(guestId: string): Promise<GuestPreferences | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/memory/${guestId}/preferences`,
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
   * Update guest preferences in memory
   */
  async setGuestPreferences(
    guestId: string,
    preferences: GuestPreferences
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/memory/${guestId}/preferences`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ key: 'preferences', value: preferences })
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get trust score for guest
   */
  async getGuestTrustScore(guestId: string): Promise<TrustScore | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/trust/guest/${guestId}`,
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
    context?: HotelContext
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
   * Generate personalized hotel recommendation
   */
  async getRecommendation(
    guestId: string,
    type: 'room' | 'dining' | 'spa' | 'activity' | 'upgrade'
  ): Promise<unknown[] | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/${guestId}`,
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
   * Log guest interaction for learning
   */
  async logInteraction(
    guestId: string,
    interaction: {
      type: string;
      channel: string;
      message: string;
      response?: string;
      outcome?: string;
    }
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/interactions/${guestId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(interaction)
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get personalized welcome message
   */
  async getWelcomeMessage(guestId: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/greetings/${guestId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return '';
      const data = await response.json();
      return data.message || '';
    } catch {
      return '';
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

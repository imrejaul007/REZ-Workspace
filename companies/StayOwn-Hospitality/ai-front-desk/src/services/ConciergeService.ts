/**
 * Concierge Service - AI-powered concierge responses
 * Now integrates with HOJAI Staybot for advanced AI capabilities
 */

import { logger } from '../config/logger';
import { config } from '../config';
import fetch from 'node-fetch';

interface ConciergeResponse {
  response: string;
  suggestions?: string[];
  confidence: number;
  source: 'ai' | 'fallback';
}

interface StaybotRequest {
  query: string;
  guestId?: string;
  hotelId?: string;
  roomId?: string;
  context?: {
    checkIn?: string;
    checkOut?: string;
    preferences?: Record<string, any>;
  };
}

interface StaybotResponse {
  response: string;
  suggestions?: string[];
  confidence: number;
  actions?: Array<{
    type: string;
    payload: Record<string, any>;
  }>;
}

type IntentCategory =
  | 'checkout'
  | 'wifi'
  | 'restaurant'
  | 'transport'
  | 'amenities'
  | 'room_service'
  | 'emergency'
  | 'general';

interface IntentMatch {
  category: IntentCategory;
  keywords: string[];
  response: string;
  suggestions: string[];
  confidence: number;
}

const INTENT_PATTERNS: IntentMatch[] = [
  {
    category: 'checkout',
    keywords: ['checkout', 'check out', 'leaving', 'departure', 'check-out'],
    response: 'To check out, please settle your bill at the front desk. You can also use our self-checkout kiosk. Luggage storage is available if your departure is later.',
    suggestions: ['Express checkout', 'Luggage storage', 'Airport transfer'],
    confidence: 0.95,
  },
  {
    category: 'wifi',
    keywords: ['wifi', 'internet', 'password', 'connect', 'network'],
    response: 'Free WiFi is available throughout the hotel. Network: StayOwn_Guest, Password: welcome123',
    suggestions: ['Technical support', 'Ethernet available', 'Business center'],
    confidence: 0.95,
  },
  {
    category: 'restaurant',
    keywords: ['restaurant', 'food', 'breakfast', 'lunch', 'dinner', 'cafe', 'coffee', 'eat'],
    response: 'Our restaurant is open:\n- Breakfast: 7 AM - 10 AM\n- Lunch: 12 PM - 3 PM\n- Dinner: 7 PM - 10 PM\nRoom service is available 24/7.',
    suggestions: ['Room service menu', 'Reserve table', 'Special dietary'],
    confidence: 0.9,
  },
  {
    category: 'transport',
    keywords: ['taxi', 'cab', 'uber', 'transport', 'airport', 'pickup', 'car', 'drive'],
    response: 'I can arrange transportation for you. Please let me know your destination and preferred time. Airport transfers start at ₹500.',
    suggestions: ['Airport transfer', 'Local sightseeing', 'Car rental'],
    confidence: 0.9,
  },
  {
    category: 'amenities',
    keywords: ['pool', 'gym', 'spa', 'fitness', 'workout', 'sauna', 'massage'],
    response: 'Our amenities:\n- Pool: 6 AM - 9 PM\n- Gym: 24/7 access with key card\n- Spa: Open 10 AM - 8 PM (prior booking required)',
    suggestions: ['Book spa treatment', 'Personal trainer', 'Yoga class'],
    confidence: 0.9,
  },
  {
    category: 'room_service',
    keywords: ['room', 'key', 'towel', 'toiletries', 'pillow', 'blanket', 'ac', 'temperature', ' housekeeping'],
    response: 'For room service, I can help with:\n- Extra amenities (towels, toiletries)\n- Temperature adjustments\n- Housekeeping requests\nWhat do you need?',
    suggestions: ['Extra towels', 'Room cleaning', 'Fix AC'],
    confidence: 0.85,
  },
  {
    category: 'emergency',
    keywords: ['emergency', 'doctor', 'medical', 'police', 'fire', 'ambulance', 'help'],
    response: 'For emergencies, please dial 0 for the front desk. Medical assistance is available 24/7. The nearest hospital is 2km away.',
    suggestions: ['Call doctor', 'Contact police', 'First aid'],
    confidence: 0.95,
  },
];

const DEFAULT_RESPONSE = {
  response: 'I am your virtual concierge. I can help with:\n- Hotel information\n- Restaurant & room service\n- Transportation\n- Local recommendations\n- Check-out process\n\nHow may I assist you?',
  suggestions: ['Restaurant hours', 'WiFi password', 'Checkout info', 'Room service'],
  confidence: 0.5,
};

export class ConciergeService {
  private staybotAvailable = true;
  private consecutiveFailures = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private readonly STAYBOT_CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

  /**
   * Check if query matches local patterns (fast path)
   */
  private matchesLocalPattern(query: string): IntentMatch | null {
    const normalizedQuery = query.toLowerCase().trim();

    for (const intent of INTENT_PATTERNS) {
      const matchedKeyword = intent.keywords.find((keyword) =>
        normalizedQuery.includes(keyword)
      );
      if (matchedKeyword) {
        return intent;
      }
    }
    return null;
  }

  /**
   * Call HOJAI Staybot for complex/unmatched queries
   */
  private async callStaybot(request: StaybotRequest): Promise<StaybotResponse | null> {
    // Circuit breaker - if Staybot is down, skip it
    if (!this.staybotAvailable) {
      logger.warn('Staybot circuit breaker open, skipping AI call');
      return null;
    }

    try {
      const response = await fetch(`${config.hojai.staybotUrl}/api/concierge/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.STAYBOT_API_KEY || 'stayown-internal',
        },
        body: JSON.stringify(request),
        timeout: 5000, // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`Staybot returned ${response.status}`);
      }

      const data = await response.json() as StaybotResponse;

      // Reset failure counter on success
      this.consecutiveFailures = 0;

      return data;
    } catch (error: any) {
      this.consecutiveFailures++;
      logger.error('Staybot call failed', {
        error: error.message,
        consecutiveFailures: this.consecutiveFailures
      });

      // Open circuit breaker after max failures
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        this.staybotAvailable = false;
        logger.warn('Staybot circuit breaker opened');

        // Schedule recovery check
        setTimeout(() => {
          this.staybotAvailable = true;
          this.consecutiveFailures = 0;
          logger.info('Staybot circuit breaker closed, service recovered');
        }, this.STAYBOT_CIRCUIT_BREAKER_TIMEOUT);
      }

      return null;
    }
  }

  /**
   * Process guest query with AI fallback
   * 1. Try local pattern match (fast)
   * 2. If no match, call HOJAI Staybot
   * 3. If Staybot fails, use local fallback
   */
  async processQuery(query: string, guestId?: string, hotelId?: string, roomId?: string): Promise<ConciergeResponse> {
    const normalizedQuery = query.toLowerCase().trim();
    logger.info('Processing concierge query', { query: normalizedQuery, guestId, hotelId });

    // Fast path: Check local patterns first
    const localMatch = this.matchesLocalPattern(normalizedQuery);
    if (localMatch) {
      logger.info('Query matched local pattern', { category: localMatch.category });
      return {
        response: localMatch.response,
        suggestions: localMatch.suggestions,
        confidence: localMatch.confidence,
        source: 'fallback',
      };
    }

    // Complex query: Try HOJAI Staybot
    logger.info('Query requires AI processing, calling Staybot');
    const staybotResponse = await this.callStaybot({
      query,
      guestId,
      hotelId,
      roomId,
    });

    if (staybotResponse) {
      logger.info('Staybot response received', { confidence: staybotResponse.confidence });
      return {
        response: staybotResponse.response,
        suggestions: staybotResponse.suggestions,
        confidence: staybotResponse.confidence,
        source: 'ai',
      };
    }

    // Staybot failed: Use partial matches as fallback
    logger.info('Using local fallback for query');
    const partialMatches = this.findPartialMatches(normalizedQuery);
    if (partialMatches.length > 0) {
      return {
        ...partialMatches[0],
        source: 'fallback',
      };
    }

    // Ultimate fallback: Default response
    return {
      ...DEFAULT_RESPONSE,
      source: 'fallback',
    };
  }

  /**
   * Legacy sync method for backward compatibility
   */
  processQueryLegacy(query: string, guestId?: string): ConciergeResponse {
    const normalizedQuery = query.toLowerCase().trim();

    logger.info('Processing concierge query (legacy)', { query: normalizedQuery, guestId });

    // Find matching intent
    const localMatch = this.matchesLocalPattern(normalizedQuery);
    if (localMatch) {
      return {
        response: localMatch.response,
        suggestions: localMatch.suggestions,
        confidence: localMatch.confidence,
        source: 'fallback',
      };
    }

    // Check for partial matches
    const partialMatches = this.findPartialMatches(normalizedQuery);
    if (partialMatches.length > 0) {
      return {
        ...partialMatches[0],
        source: 'fallback',
      };
    }

    // Return default response
    return {
      ...DEFAULT_RESPONSE,
      source: 'fallback',
    };
  }

  /**
   * Find partial matches with lower confidence
   */
  private findPartialMatches(query: string): ConciergeResponse[] {
    const results: ConciergeResponse[] = [];

    // Check for time-related queries
    if (query.includes('time') || query.includes('when') || query.includes('open') || query.includes('close')) {
      results.push({
        response: 'Our operating hours:\n- Front Desk: 24/7\n- Restaurant: 7 AM - 10 PM\n- Pool: 6 AM - 9 PM\n- Gym: 24/7\n- Spa: 10 AM - 8 PM',
        suggestions: ['Restaurant menu', 'Pool schedule', 'Spa booking'],
        confidence: 0.7,
      });
    }

    // Check for location/directions queries
    if (query.includes('where') || query.includes('location') || query.includes('directions') || query.includes('floor')) {
      results.push({
        response: 'Here are some common locations:\n- Front Desk: Ground floor lobby\n- Restaurant: 2nd floor\n- Gym: 3rd floor\n- Pool: 5th floor\n- Spa: 4th floor',
        suggestions: ['Map to room', 'Parking info', 'Nearby places'],
        confidence: 0.7,
      });
    }

    // Check for price/cost queries
    if (query.includes('price') || query.includes('cost') || query.includes('charge') || query.includes('pay')) {
      results.push({
        response: 'For pricing information, please visit the front desk or call us. Room service has a 20% surcharge. Laundry is charged per item.',
        suggestions: ['Room service prices', 'Laundry rates', 'Airport transfer cost'],
        confidence: 0.65,
      });
    }

    return results;
  }

  /**
   * Get greeting based on time of day
   */
  getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good morning! How may I assist you today?';
    } else if (hour < 17) {
      return 'Good afternoon! How may I assist you today?';
    } else {
      return 'Good evening! How may I assist you today?';
    }
  }

  /**
   * Get welcome message
   */
  getWelcomeMessage(): ConciergeResponse {
    return {
      response: `${this.getGreeting()}\n\nI'm your virtual concierge. I can help with:\n- Hotel information & services\n- Restaurant & room service\n- Transportation arrangements\n- Local recommendations\n- Check-in/out assistance\n\nHow may I help you?`,
      suggestions: ['Restaurant hours', 'WiFi info', 'Room service', 'Airport taxi'],
      confidence: 1.0,
      source: 'fallback',
    };
  }

  /**
   * Check Staybot health and update circuit breaker status
   */
  async checkStaybotHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${config.hojai.staybotUrl}/health`, {
        timeout: 3000,
      });

      if (response.ok) {
        if (!this.staybotAvailable) {
          // Recover from circuit breaker
          this.staybotAvailable = true;
          this.consecutiveFailures = 0;
          logger.info('Staybot recovered, circuit breaker closed');
        }
        return true;
      }
    } catch (error) {
      logger.warn('Staybot health check failed');
    }
    return false;
  }
}

export const conciergeService = new ConciergeService();
export default conciergeService;
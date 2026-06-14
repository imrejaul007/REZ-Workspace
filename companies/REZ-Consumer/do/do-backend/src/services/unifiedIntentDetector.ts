/**
 * Unified Intent Detector
 *
 * Shared by:
 * - Do App
 * - Support Copilot
 * - All ReZ Apps
 *
 * Uses:
 * - Support Copilot patterns
 * - Do App patterns
 * - Hinglish support
 * - Priority-based matching
 */

import {
  UnifiedIntent,
  UNIFIED_INTENT_PATTERNS,
  HINGLISH_PATTERNS,
  ExtractedEntity,
  RESPONSE_TEMPLATES,
  SENTIMENT_PATTERNS,
  ESCALATION_RULES,
  QuickAction,
  QUICK_ACTIONS,
} from './unifiedTrainingData.js';

export interface IntentResult {
  intent: UnifiedIntent;
  confidence: number;
  entities: ExtractedEntity[];
  sentiment: 'positive' | 'negative' | 'neutral';
  shouldEscalate: boolean;
  suggestedActions: QuickAction[];
}

export class UnifiedIntentDetector {
  /**
   * Detect intent from user message
   */
  detect(text: string): IntentResult {
    const normalizedText = this.normalizeText(text);
    const scores = this.calculateScores(normalizedText, text);
    const bestMatch = this.getBestMatch(scores);

    const entities = this.extractEntities(text);
    const sentiment = this.detectSentiment(text);
    const shouldEscalate = this.shouldEscalate(text, sentiment);
    const suggestedActions = this.getSuggestedActions(bestMatch.intent);

    return {
      intent: bestMatch.intent,
      confidence: bestMatch.confidence,
      entities,
      sentiment,
      shouldEscalate,
      suggestedActions,
    };
  }

  /**
   * Normalize text (handle Hinglish, typos)
   */
  private normalizeText(text: string): string {
    let normalized = text.toLowerCase().trim();

    // Replace Hinglish words
    Object.entries(HINGLISH_PATTERNS).forEach(([hindi, english]) => {
      normalized = normalized.replace(new RegExp(`\\b${hindi}\\b`, 'gi'), english);
    });

    // Common typos
    const typos: Record<string, string> = {
      'ordr': 'order',
      'bok': 'book',
      'bk': 'book',
      'cncl': 'cancel',
      'cancle': 'cancel',
      'reseve': 'reserve',
      'rsrv': 'reserve',
      'delivry': 'delivery',
      'dilvery': 'delivery',
      'deliv': 'delivery',
      'refnd': 'refund',
      'refud': 'refund',
      'complet': 'complete',
      'complt': 'complete',
      'availble': 'available',
      'avail': 'available',
      'tbl': 'table',
      'tble': 'table',
      'resto': 'restaurant',
      'restaurent': 'restaurant',
      'restuarant': 'restaurant',
    };

    Object.entries(typos).forEach(([typo, correction]) => {
      normalized = normalized.replace(new RegExp(`\\b${typo}\\b`, 'gi'), correction);
    });

    // Remove extra spaces
    normalized = normalized.replace(/\s+/g, ' ');

    return normalized;
  }

  /**
   * Calculate intent scores
   */
  private calculateScores(normalizedText: string, originalText: string): Record<UnifiedIntent, {
    score: number;
    weightedScore: number;
  }> {
    const scores: Record<UnifiedIntent, { score: number; weightedScore: number }> = {} as unknown;

    Object.entries(UNIFIED_INTENT_PATTERNS).forEach(([intentKey, config]) => {
      const intent = intentKey as UnifiedIntent;
      let score = 0;

      // Check each pattern
      config.patterns.forEach((pattern: string) => {
        const patternLower = pattern.toLowerCase();

        // Exact match
        if (normalizedText.includes(patternLower)) {
          score += config.weight;
        }

        // Fuzzy match for longer phrases
        if (patternLower.length > 5) {
          const words = patternLower.split(' ');
          const matchCount = words.filter(word => normalizedText.includes(word)).length;
          if (matchCount === words.length) {
            score += config.weight * 1.5;
          } else if (matchCount > 1) {
            score += (matchCount / words.length) * config.weight;
          }
        }
      });

      // Apply priority multiplier
      const priorityMultiplier = 11 - config.priority;
      const weightedScore = score * priorityMultiplier;

      scores[intent] = { score, weightedScore };
    });

    return scores;
  }

  /**
   * Get best matching intent
   */
  private getBestMatch(scores: Record<UnifiedIntent, { score: number; weightedScore: number }>): {
    intent: UnifiedIntent;
    confidence: number;
  } {
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1].weightedScore - a[1].weightedScore);

    if (sorted.length === 0) {
      return { intent: UnifiedIntent.UNKNOWN, confidence: 0 };
    }

    const [bestIntent, bestScore] = sorted[0];

    // If no patterns matched
    if (bestScore.score === 0) {
      return { intent: UnifiedIntent.UNKNOWN, confidence: 0.1 };
    }

    // Calculate confidence
    const baseConfidence = 0.4;
    const scoreBonus = Math.min(bestScore.score * 0.15, 0.5);
    const priorityBonus = (11 - UNIFIED_INTENT_PATTERNS[bestIntent].priority) * 0.02;
    const confidence = Math.min(baseConfidence + scoreBonus + priorityBonus, 0.98);

    return {
      intent: bestIntent as UnifiedIntent,
      confidence: Math.max(confidence, 0.3),
    };
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const lowerText = text.toLowerCase();

    // Extract food items
    const foodPatterns = ['biryani', 'pizza', 'burger', 'pasta', 'noodles', 'rice', 'thali', 'naan', 'dal', 'paneer', 'chicken', 'mutton', 'fish', 'soup', 'dessert', 'coffee', 'tea'];
    foodPatterns.forEach(food => {
      if (lowerText.includes(food)) {
        entities.push({ type: 'food_item', value: food, confidence: 0.9 });
      }
    });

    // Extract quantities
    const quantityPatterns = [
      { pattern: /(\d+)\s*(people|person|guests?)/i, value: 'party_size' },
      { pattern: /for\s*(\d+)/i, value: 'party_size' },
      { pattern: /(\d+)\s*(hrs?|hours?)/i, value: 'hours' },
    ];
    quantityPatterns.forEach(({ pattern, value }) => {
      const match = text.match(pattern);
      if (match) {
        entities.push({ type: 'quantity', value: match[1], confidence: 0.85 });
      }
    });

    // Extract time
    const timePatterns = [
      { pattern: /(\d+)\s*(am|pm)/i, value: 'time' },
      { pattern: /(morning|afternoon|evening|night|noon)/i, value: 'time_of_day' },
    ];
    timePatterns.forEach(({ pattern, value }) => {
      const match = text.match(pattern);
      if (match) {
        entities.push({ type: 'time', value: match[0], confidence: 0.8 });
      }
    });

    // Extract price/budget
    const pricePatterns = [
      { pattern: /under\s*₹?\s*(\d+)/i, value: 'budget_max' },
      { pattern: /(\d+)\s*rupees?/i, value: 'price' },
      { pattern: /(budget|cheap|expensive|premium|luxury)/i, value: 'price_tier' },
    ];
    pricePatterns.forEach(({ pattern, value }) => {
      const match = text.match(pattern);
      if (match) {
        entities.push({ type: 'price', value: match[0], confidence: 0.75 });
      }
    });

    return entities;
  }

  /**
   * Detect sentiment
   */
  private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();

    let positiveCount = 0;
    let negativeCount = 0;

    SENTIMENT_PATTERNS.positive.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    SENTIMENT_PATTERNS.negative.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  /**
   * Check if should escalate to human
   */
  private shouldEscalate(text: string, sentiment: 'positive' | 'negative' | 'neutral'): boolean {
    const lowerText = text.toLowerCase();

    // Check escalation keywords
    for (const keyword of ESCALATION_RULES.escalate_keywords) {
      if (lowerText.includes(keyword)) {
        return true;
      }
    }

    // High frustration words
    for (const word of ESCALATION_RULES.high_frustration) {
      if (lowerText.includes(word)) {
        return true;
      }
    }

    // Very negative sentiment
    if (sentiment === 'negative') {
      const words = lowerText.split(' ');
      if (words.filter(w => SENTIMENT_PATTERNS.negative.includes(w)).length >= 3) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get suggested actions based on intent
   */
  private getSuggestedActions(intent: UnifiedIntent): QuickAction[] {
    const suggestions: QuickAction[] = [];

    switch (intent) {
      case UnifiedIntent.ORDER_FOOD:
        suggestions.push(
          { label: 'Browse Restaurants', icon: '🍽️', action: 'browse_restaurants' },
          { label: 'View Offers', icon: '🎁', action: 'view_offers' },
        );
        break;

      case UnifiedIntent.BOOK_TABLE:
        suggestions.push(
          { label: 'Check Availability', icon: '📅', action: 'check_availability' },
          { label: 'View Menu', icon: '📋', action: 'view_menu' },
        );
        break;

      case UnifiedIntent.CHECK_STATUS:
        suggestions.push(
          { label: 'Track Order', icon: '📦', action: 'track_order' },
          { label: 'Call Support', icon: '📞', action: 'call_support' },
        );
        break;

      case UnifiedIntent.COMPLAINT:
        suggestions.push(
          { label: 'Get Refund', icon: '💰', action: 'request_refund' },
          { label: 'Talk to Manager', icon: '👔', action: 'escalate' },
        );
        break;

      case UnifiedIntent.CHECK_BALANCE:
        suggestions.push(
          { label: 'View Transactions', icon: '📜', action: 'view_history' },
          { label: 'Redeem Coins', icon: '🎫', action: 'redeem_coins' },
        );
        break;

      default:
        suggestions.push(
          { label: 'View Offers', icon: '🎁', action: 'view_offers' },
          { label: 'My Bookings', icon: '📋', action: 'view_bookings' },
        );
    }

    return suggestions;
  }

  /**
   * Get response for intent
   */
  getResponse(intent: UnifiedIntent, context?: Record<string, unknown>): string {
    const config = UNIFIED_INTENT_PATTERNS[intent];
    if (!config) {
      return this.getRandomResponse('fallback');
    }

    // Check for contextual responses first
    if (context?.template) {
      return this.applyContext(config.response, context);
    }

    return config.response;
  }

  /**
   * Apply context to response
   */
  private applyContext(template: string, context: Record<string, unknown>): string {
    let response = template;

    Object.entries(context).forEach(([key, value]) => {
      response = response.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });

    return response;
  }

  /**
   * Get random response from template category
   * NOTE: Using Math.random() here is acceptable for UI text selection
   * as it only selects from predefined templates, not for security purposes.
   */
  private getRandomResponse(category: keyof typeof RESPONSE_TEMPLATES): string {
    const templates = RESPONSE_TEMPLATES[category];
    if (!templates || templates.length === 0) {
      return 'I\'m not sure I understood. Could you rephrase?';
    }
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

// Export singleton
export const unifiedIntentDetector = new UnifiedIntentDetector();
export default unifiedIntentDetector;

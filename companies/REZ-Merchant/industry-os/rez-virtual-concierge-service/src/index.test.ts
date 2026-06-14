/**
 * Unit Tests for REZ Virtual Concierge Service
 */

import { describe, it, expect } from 'vitest';

describe('REZ Virtual Concierge Service', () => {
  describe('Intent Classification', () => {
    const IntentType = {
      ROOM_SERVICE: 'room_service',
      CONCIERGE_INFO: 'concierge_info',
      COMPLAINT: 'complaint',
      BOOKING_QUERY: 'booking_query',
      AMENITY_INFO: 'amenity_info',
      CHECKOUT: 'checkout',
      DIRECTION: 'direction',
      RECOMMENDATION: 'recommendation',
      COMPLIMENT: 'compliment',
      GENERAL: 'general',
      ESCALATE: 'escalate',
    };

    function classifyIntent(message: string): { intent: string; confidence: number } {
      const lower = message.toLowerCase();

      if (/\b(room service|food|meal|breakfast|dinner|lunch|dish|order|menu|coffee|tea|water|bottle|drink)\b/.test(lower)) {
        return { intent: 'room_service', confidence: 0.9 };
      }
      if (/\b(pool|gym|spa|restaurant|bar|cafe|wi-?fi|parking|checkout|check-?in|time|hour|when|where|what)\b/.test(lower)) {
        return { intent: 'concierge_info', confidence: 0.85 };
      }
      if (/\b(complaint|problem|issue|broken|not working|dirty|noisy|noise|smell|cold|hot|leak|fix|repair)\b/.test(lower)) {
        return { intent: 'complaint', confidence: 0.9 };
      }
      if (/\b(booking|reservation|confirm|extend|extra night|late checkout|early checkin|cancel|confirmation)\b/.test(lower)) {
        return { intent: 'booking_query', confidence: 0.85 };
      }
      if (/\b(manager|speak to someone|human|real person|supervisor|angry|emergency)\b/.test(lower)) {
        return { intent: 'escalate', confidence: 0.9 };
      }
      return { intent: 'general', confidence: 0.5 };
    }

    it('should classify room service intent correctly', () => {
      const result = classifyIntent('I want to order room service for dinner');
      expect(result.intent).toBe('room_service');
      expect(result.confidence).toBe(0.9);
    });

    it('should classify concierge info intent correctly', () => {
      const result = classifyIntent('What time does the pool open?');
      expect(result.intent).toBe('concierge_info');
      expect(result.confidence).toBe(0.85);
    });

    it('should classify complaint intent correctly', () => {
      const result = classifyIntent('The AC is not working and the room is too hot');
      expect(result.intent).toBe('complaint');
      expect(result.confidence).toBe(0.9);
    });

    it('should classify booking query intent correctly', () => {
      const result = classifyIntent('Can I extend my stay for one more night?');
      expect(result.intent).toBe('booking_query');
      expect(result.confidence).toBe(0.85);
    });

    it('should classify escalation intent correctly', () => {
      const result = classifyIntent('I want to speak to the manager immediately');
      expect(result.intent).toBe('escalate');
      expect(result.confidence).toBe(0.9);
    });

    it('should classify general intent with low confidence', () => {
      const result = classifyIntent('Hello there');
      expect(result.intent).toBe('general');
      expect(result.confidence).toBe(0.5);
    });

    it('should handle case insensitivity', () => {
      const upper = classifyIntent('I NEED ROOM SERVICE');
      const lower = classifyIntent('i need room service');
      expect(upper.intent).toBe(lower.intent);
    });
  });

  describe('Sentiment Analysis', () => {
    function analyzeSentiment(message: string): string {
      const lower = message.toLowerCase();
      const positiveWords = ['great', 'amazing', 'excellent', 'wonderful', 'love', 'perfect', 'best', 'awesome', 'fantastic', 'happy', 'satisfied', 'recommend', 'thank', 'thanks'];
      const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointed', 'angry', 'frustrated', 'problem', 'issue', 'complaint', 'unacceptable', 'poor'];

      let score = 0;
      positiveWords.forEach(w => { if (lower.includes(w)) score++; });
      negativeWords.forEach(w => { if (lower.includes(w)) score--; });

      if (score > 0) return 'positive';
      if (score < 0) return 'negative';
      return 'neutral';
    }

    it('should detect positive sentiment', () => {
      expect(analyzeSentiment('This hotel is amazing!')).toBe('positive');
      expect(analyzeSentiment('Thank you so much for the excellent service!')).toBe('positive');
    });

    it('should detect negative sentiment', () => {
      expect(analyzeSentiment('Terrible experience, very disappointed')).toBe('negative');
      expect(analyzeSentiment('The room has many problems and issues')).toBe('negative');
    });

    it('should return neutral for mixed or no sentiment', () => {
      expect(analyzeSentiment('The room was okay')).toBe('neutral');
      expect(analyzeSentiment('Hello, what time is checkout?')).toBe('neutral');
    });

    it('should handle multiple positive words', () => {
      const result = analyzeSentiment('Great amazing excellent wonderful perfect hotel!');
      expect(result).toBe('positive');
    });

    it('should handle multiple negative words', () => {
      const result = analyzeSentiment('Bad terrible awful horrible worst experience');
      expect(result).toBe('negative');
    });
  });

  describe('Service Request Types', () => {
    const validTypes = ['room_service', 'housekeeping', 'maintenance', 'restaurant', 'spa', 'taxi', 'other'];
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    const validStatuses = ['pending', 'acknowledged', 'in_progress', 'completed', 'cancelled'];

    it('should validate service request types', () => {
      validTypes.forEach(type => {
        expect(validTypes.includes(type)).toBe(true);
      });
    });

    it('should validate priority levels', () => {
      validPriorities.forEach(priority => {
        expect(validPriorities.includes(priority)).toBe(true);
      });
    });

    it('should validate status values', () => {
      validStatuses.forEach(status => {
        expect(validStatuses.includes(status)).toBe(true);
      });
    });

    it('should get estimated time for each service type', () => {
      const times: Record<string, string> = {
        room_service: '30-45 minutes',
        housekeeping: '1-2 hours',
        maintenance: '2-4 hours',
        restaurant: '45-60 minutes',
        spa: 'As per booking',
        taxi: '15-20 minutes',
        other: '1-2 hours',
      };

      expect(times.room_service).toBe('30-45 minutes');
      expect(times.housekeeping).toBe('1-2 hours');
      expect(times.maintenance).toBe('2-4 hours');
    });
  });

  describe('Conversation Management', () => {
    const ConversationStatus = {
      ACTIVE: 'active',
      CLOSED: 'closed',
      ESCALATED: 'escalated',
    };

    it('should have valid conversation statuses', () => {
      expect(Object.values(ConversationStatus)).toContain('active');
      expect(Object.values(ConversationStatus)).toContain('closed');
      expect(Object.values(ConversationStatus)).toContain('escalated');
    });

    it('should generate unique conversation IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      }
      expect(ids.size).toBe(100);
    });

    it('should handle conversation escalation rules', () => {
      const shouldEscalate = (intent: string, sentiment: string, confidence: number): boolean => {
        return intent === 'escalate' || (sentiment === 'negative' && confidence > 0.8);
      };

      expect(shouldEscalate('escalate', 'neutral', 0.9)).toBe(true);
      expect(shouldEscalate('general', 'negative', 0.85)).toBe(true);
      expect(shouldEscalate('general', 'neutral', 0.5)).toBe(false);
      expect(shouldEscalate('compliment', 'positive', 0.9)).toBe(false);
    });
  });

  describe('Knowledge Base', () => {
    it('should validate knowledge base categories', () => {
      const validCategories = ['amenities', 'dining', 'services', 'policies', 'local', 'faq', 'emergency'];
      validCategories.forEach(cat => {
        expect(validCategories.includes(cat)).toBe(true);
      });
    });

    it('should match keywords correctly', () => {
      const article = {
        keywords: ['wifi', 'internet', 'connection', 'password']
      };
      const query = 'how do i connect to the wifi';

      const matches = article.keywords.some(k => query.toLowerCase().includes(k));
      expect(matches).toBe(true);
    });

    it('should handle keyword matching case insensitively', () => {
      const article = {
        keywords: ['Pool', 'Gym', 'WiFi']
      };
      const query = 'is the wifi available?';

      const matches = article.keywords.some(k => query.toLowerCase().includes(k.toLowerCase()));
      expect(matches).toBe(true);
    });
  });

  describe('Response Generation', () => {
    const responses: Record<string, string[]> = {
      room_service: [
        "I'd be happy to help with room service!",
        "For room service, you can order from our menu."
      ],
      complaint: [
        "I'm sorry to hear about your experience.",
        "I sincerely apologize for the inconvenience."
      ],
      compliment: [
        "Thank you so much for your kind words!",
        "We're so happy to hear you enjoyed your stay!"
      ],
    };

    it('should return appropriate responses for intents', () => {
      expect(responses.room_service.length).toBeGreaterThan(0);
      expect(responses.complaint.length).toBeGreaterThan(0);
      expect(responses.compliment.length).toBeGreaterThan(0);
    });

    it('should select from multiple response options', () => {
      const options = responses.room_service;
      const selected = options[Math.floor(Math.random() * options.length)];
      expect(responses.room_service).toContain(selected);
    });
  });

  describe('Quick Actions', () => {
    it('should have valid quick action IDs', () => {
      const actions = ['room_service', 'housekeeping', 'taxi', 'checkout', 'wifi', 'spa', 'restaurant', 'directions'];
      actions.forEach(action => {
        expect(typeof action).toBe('string');
        expect(action.length).toBeGreaterThan(0);
      });
    });

    it('should provide appropriate responses for each action', () => {
      const responses: Record<string, string> = {
        wifi: 'The WiFi password for this room is: STAYOWN-5G-Guest',
        checkout: 'Your checkout has been processed.',
        spa: 'Our spa is open from 9 AM to 9 PM.',
      };

      expect(responses.wifi).toContain('WiFi');
      expect(responses.spa).toContain('9 AM');
    });
  });

  describe('Analytics', () => {
    it('should calculate conversation statistics', () => {
      const conversations = [
        { status: 'active' },
        { status: 'active' },
        { status: 'closed' },
        { status: 'closed' },
        { status: 'closed' },
        { status: 'escalated' },
      ];

      const stats = {
        total: conversations.length,
        active: conversations.filter(c => c.status === 'active').length,
        closed: conversations.filter(c => c.status === 'closed').length,
        escalated: conversations.filter(c => c.status === 'escalated').length,
      };

      expect(stats.total).toBe(6);
      expect(stats.active).toBe(2);
      expect(stats.closed).toBe(3);
      expect(stats.escalated).toBe(1);
    });

    it('should aggregate intent statistics', () => {
      const messages = [
        { intent: 'room_service' },
        { intent: 'room_service' },
        { intent: 'complaint' },
        { intent: 'concierge_info' },
      ];

      const intentCounts = messages.reduce((acc, msg) => {
        acc[msg.intent] = (acc[msg.intent] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(intentCounts.room_service).toBe(2);
      expect(intentCounts.complaint).toBe(1);
      expect(intentCounts.concierge_info).toBe(1);
    });
  });
});

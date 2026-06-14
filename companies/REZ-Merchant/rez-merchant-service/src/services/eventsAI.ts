// Events AI extends AIService
import { AIService } from '@rez/base-services/ai';

export interface EventRecommendation {
  eventId: string;
  eventName: string;
  relevance: number;
  reason: string;
  venue: string;
  date: Date;
  price: number;
  distance?: number;
}

export interface AttendancePrediction {
  eventId: string;
  predictedAttendance: number;
  confidence: number;
  factors: {
    name: string;
    impact: number;
  }[];
  timestamp: Date;
}

export interface DynamicPricing {
  eventId: string;
  currentPrice: number;
  suggestedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  factors: {
    factor: string;
    weight: number;
    adjustment: number;
  }[];
  demandLevel: 'low' | 'medium' | 'high' | 'sold-out';
  lastUpdated: Date;
}

export class EventsAIService extends AIService {
  /**
   * Get personalized event recommendations for customer
   */
  async getEventRecommendations(customerId: string): Promise<EventRecommendation[]> {
    const customerPreferences = await this.getContext(customerId);

    const events = await this.analyzePatterns(customerId, 'events');

    return events.map((event) => ({
      eventId: event.id,
      eventName: event.name,
      relevance: event.relevanceScore || 0.85,
      reason: event.reason || 'Based on your preferences',
      venue: event.venue,
      date: new Date(event.date),
      price: event.price,
      distance: event.distance,
    }));
  }

  /**
   * Predict attendance for an event
   */
  async predictAttendance(eventId: string): Promise<AttendancePrediction> {
    const prediction = await this.predict(eventId, {
      type: 'attendance',
      horizon: '7d',
    });

    return {
      eventId,
      predictedAttendance: prediction.value || 0,
      confidence: prediction.confidence || 0.75,
      factors: prediction.factors || [],
      timestamp: new Date(),
    };
  }

  /**
   * Get dynamic pricing for event tickets
   */
  async getDynamicPricing(eventId: string): Promise<DynamicPricing> {
    const pricing = await this.analyzeDemand(eventId);

    const demandLevel =
      pricing.demand < 0.3 ? 'low' :
      pricing.demand < 0.7 ? 'medium' :
      pricing.demand >= 0.9 ? 'sold-out' : 'high';

    return {
      eventId,
      currentPrice: pricing.currentPrice || 0,
      suggestedPrice: pricing.suggestedPrice || 0,
      priceRange: {
        min: pricing.minPrice || 0,
        max: pricing.maxPrice || 0,
      },
      factors: pricing.adjustments || [],
      demandLevel,
      lastUpdated: new Date(),
    };
  }
}

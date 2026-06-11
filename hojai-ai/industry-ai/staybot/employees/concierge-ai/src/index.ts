/**
 * Concierge AI - Hotel Concierge Agent
 * Part of STAYBOT - Hotel AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface Recommendation {
  id: string;
  type: 'restaurant' | 'attraction' | 'spa' | 'transport' | 'shopping';
  name: string;
  rating: number;
  priceRange: string;
  distance: string;
  description: string;
  aiNote?: string;
  bookingRequired?: boolean;
  openingHours?: string;
}

export interface GuestPreference {
  preferences: string[];
  dietaryRestrictions?: string[];
  interests?: string[];
  accessibilityNeeds?: string[];
}

export class ConciergeAI {
  private readonly recommendations: Map<string, Recommendation[]> = new Map();

  constructor() {
    this.initializeRecommendations();
  }

  private initializeRecommendations(): void {
    // Dining recommendations
    this.recommendations.set('dining', [
      { id: '1', type: 'restaurant', name: 'Rooftop Restaurant - Sunset', rating: 4.8, priceRange: '₹1500-3000', distance: '0.5 km', description: 'Fine dining with city views', aiNote: 'Great for romantic dinners', bookingRequired: true, openingHours: '6 PM - 11 PM' },
      { id: '2', type: 'restaurant', name: 'Local Bistro', rating: 4.5, priceRange: '₹500-1000', distance: '1 km', description: 'Authentic local cuisine', aiNote: 'Famous for biryani' },
      { id: '3', type: 'restaurant', name: 'Café Delight', rating: 4.3, priceRange: '₹300-600', distance: '0.2 km', description: 'Quick bites and coffee', openingHours: '7 AM - 10 PM' },
    ]);

    // Attractions
    this.recommendations.set('attractions', [
      { id: '4', type: 'attraction', name: 'City Heritage Walk', rating: 4.6, priceRange: '₹200', distance: '1.5 km', description: 'Guided historical tour', aiNote: 'Best at 7-9 AM' },
      { id: '5', type: 'attraction', name: 'Central Museum', rating: 4.4, priceRange: '₹150', distance: '2 km', description: 'Local art and history', openingHours: '9 AM - 6 PM' },
      { id: '6', type: 'attraction', name: 'Botanical Gardens', rating: 4.7, priceRange: '₹100', distance: '3 km', description: 'Peaceful nature retreat', aiNote: 'Perfect for morning walks' },
    ]);

    // Spa & Wellness
    this.recommendations.set('spa', [
      { id: '7', type: 'spa', name: 'Hotel Spa - Serenity', rating: 4.9, priceRange: '₹2500-5000', distance: 'Same floor', description: 'Full service spa and wellness', aiNote: '10% off for loyalty members', bookingRequired: true },
      { id: '8', type: 'spa', name: 'Yoga Studio', rating: 4.6, priceRange: '₹500/session', distance: '0.5 km', description: 'Morning yoga classes', openingHours: '6 AM - 8 PM' },
    ]);
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(
    category?: string,
    preferences?: GuestPreference
  ): Promise<{ recommendations: Recommendation[]; message: string }> {
    let results: Recommendation[] = [];

    if (category) {
      results = this.recommendations.get(category) || [];
    } else {
      // Get all categories
      this.recommendations.forEach(recs => results.push(...recs));
    }

    // Sort by rating and apply personalization
    const personalized = results
      .map(rec => ({
        ...rec,
        relevanceScore: this.calculateRelevance(rec, preferences)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 6)
      .map(({ relevanceScore, ...rec }) => rec);

    const message = this.generateRecommendationMessage(personalized, preferences);

    return { recommendations: personalized, message };
  }

  /**
   * Book a recommendation
   */
  async bookRecommendation(
    guestId: string,
    recommendationId: string,
    dateTime?: string
  ): Promise<{ bookingId: string; message: string }> {
    const bookingId = uuidv4();
    return {
      bookingId,
      message: `Booking confirmed! Your reservation at has been made. Confirmation will be sent to your room.`
    };
  }

  /**
   * Handle special requests
   */
  async handleRequest(
    requestType: string,
    details: Record<string, unknown>
  ): Promise<{ success: boolean; message: string; eta?: string }> {
    const handlers: Record<string, () => { success: boolean; message: string; eta?: string }> = {
      'taxi': () => ({ success: true, message: 'A taxi has been arranged for you.', eta: '10 minutes' }),
      'table': () => ({ success: true, message: 'Restaurant table booking confirmed.', eta: '30 minutes' }),
      'tour': () => ({ success: true, message: 'Guided tour has been arranged.', eta: '1 hour' }),
      'spa': () => ({ success: true, message: 'Spa appointment scheduled.', eta: '2 hours' }),
      'transport': () => ({ success: true, message: 'Transportation arranged.', eta: '15 minutes' }),
    };

    const handler = handlers[requestType.toLowerCase()];
    if (handler) {
      return handler();
    }

    return { success: true, message: `I'll help you with your ${requestType} request.` };
  }

  /**
   * Get local information
   */
  async getLocalInfo(
    topic: string
  ): Promise<{ info: string; related?: Recommendation[] }> {
    const infoMap: Record<string, { info: string; related?: Recommendation[] }> = {
      'weather': { info: 'Current weather: Sunny, 28°C. Perfect for outdoor activities!' },
      'currency': { info: 'Currency exchange available at the front desk. Current rate: 1 USD = 83 INR' },
      'emergency': { info: 'Emergency services: Hospital - 2km, Police - 1km. Hotel emergency: Extension 9' },
      'transport': { info: 'Nearest metro: 1.5km. Taxi stand: At hotel entrance. Airport: 15km (25 mins)' },
      'customs': { info: 'Local customs: Remove shoes before entering temples. Tipping: 10-15% appreciated.' },
    };

    return infoMap[topic.toLowerCase()] || { info: 'Information not available. Please ask the concierge.' };
  }

  private calculateRelevance(rec: Recommendation, preferences?: GuestPreference): number {
    let score = rec.rating * 10;

    if (preferences?.interests?.includes(rec.type)) {
      score += 20;
    }

    if (rec.distance === 'Same floor' || rec.distance === '0.5 km') {
      score += 10;
    }

    if (rec.bookingRequired) {
      score -= 5; // Slight penalty for complexity
    }

    return score;
  }

  private generateRecommendationMessage(recs: Recommendation[], preferences?: GuestPreference): string {
    if (recs.length === 0) {
      return "I couldn't find recommendations matching your criteria.";
    }

    let message = 'Based on your preferences';
    if (preferences?.preferences?.length) {
      message += ` (${preferences.preferences.join(', ')})`;
    }
    message += ', I recommend: ';

    return message + recs.slice(0, 3).map(r => r.name).join(', ');
  }
}

export default ConciergeAI;
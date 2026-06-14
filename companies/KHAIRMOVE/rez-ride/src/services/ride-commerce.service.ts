/**
 * Ride Commerce Service
 *
 * "Commerce before destination" - In-ride offers and promotions
 *
 * During ride, show contextual offers based on:
 * - Destination prediction
 * - User preferences
 * - Time of day
 * - Location context
 */

import { Logger } from '@nestjs/common';

export interface CommerceOffer {
  id: string;
  type: 'food' | 'coffee' | 'fuel' | 'shopping' | 'entertainment' | 'health' | 'travel' | 'parking';
  merchantId: string;
  merchantName: string;
  title: string;
  description: string;
  imageUrl?: string;
  discount: number; // percentage
  cashback: number; // INR
  expiresAt: Date;
  terms: string[];
  deepLink: string;
  relevanceScore: number; // 0-100
}

export interface RideContext {
  userId: string;
  rideId: string;
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  currentLocation: { lat: number; lng: number };
  destinationType?: 'home' | 'office' | 'mall' | 'restaurant' | 'airport' | 'hospital' | 'unknown';
  eta: number; // minutes
  distance: number; // km
  timeOfDay: number; // hour
  dayOfWeek: number;
  userPreferences?: {
    favoriteFood?: string[];
    favoriteBrands?: string[];
    dietaryRestrictions?: string[];
  };
}

export class RideCommerceService {
  private readonly logger = new Logger('RideCommerceService');

  // Mock merchant offers
  private mockOffers: CommerceOffer[] = [
    {
      id: 'offer_1',
      type: 'food',
      merchantId: 'mcd',
      merchantName: "McDonald's",
      title: 'Big Mac Combo @ 30% Off',
      description: 'Order now and pick up on the way',
      discount: 30,
      cashback: 20,
      expiresAt: new Date(Date.now() + 3600000),
      terms: ['Min order ₹300', 'Valid for pickup'],
      deepLink: 'reznow://mcdonalds',
      relevanceScore: 85,
    },
    {
      id: 'offer_2',
      type: 'coffee',
      merchantId: 'starbucks',
      merchantName: 'Starbucks',
      title: 'Buy 1 Get 1 Free',
      description: 'Perfect for your morning meeting',
      discount: 50,
      cashback: 50,
      expiresAt: new Date(Date.now() + 7200000),
      terms: ['Any size', 'Valid before 11 AM'],
      deepLink: 'reznow://starbucks',
      relevanceScore: 78,
    },
    {
      id: 'offer_3',
      type: 'fuel',
      merchantId: 'bp',
      merchantName: 'BP Petrol Pump',
      title: '₹5/Liter Cashback',
      description: 'Fuel up and earn cashback',
      discount: 0,
      cashback: 50,
      expiresAt: new Date(Date.now() + 86400000),
      terms: ['Min 5 liters', 'Max ₹50 cashback'],
      deepLink: 'reznow://bp-fuel',
      relevanceScore: 65,
    },
    {
      id: 'offer_4',
      type: 'shopping',
      merchantId: 'zara',
      merchantName: 'Zara',
      title: '20% Off on New Collection',
      description: 'Be the first to shop the latest trends',
      discount: 20,
      cashback: 100,
      expiresAt: new Date(Date.now() + 172800000),
      terms: ['In-store only', 'Excludes sale items'],
      deepLink: 'reznow://zara',
      relevanceScore: 72,
    },
    {
      id: 'offer_5',
      type: 'entertainment',
      merchantId: 'pvr',
      merchantName: 'PVR Cinemas',
      title: '2 Movie Tickets @ ₹499',
      description: 'Book your weekend entertainment',
      discount: 25,
      cashback: 100,
      expiresAt: new Date(Date.now() + 259200000),
      terms: ['Mon-Fri only', 'Select cities'],
      deepLink: 'reznow://pvr',
      relevanceScore: 68,
    },
    {
      id: 'offer_6',
      type: 'parking',
      merchantId: 'parking',
      merchantName: 'Secure Parking',
      title: 'Free 2 Hours Parking',
      description: 'Park free when you ride to us',
      discount: 100,
      cashback: 0,
      expiresAt: new Date(Date.now() + 14400000),
      terms: ['At participating locations'],
      deepLink: 'reznow://parking',
      relevanceScore: 90,
    },
    {
      id: 'offer_7',
      type: 'health',
      merchantId: 'apollo',
      merchantName: 'Apollo Pharmacy',
      title: '15% Off Medicines',
      description: 'Health essentials delivered',
      discount: 15,
      cashback: 25,
      expiresAt: new Date(Date.now() + 43200000),
      terms: ['Prescription required for some'],
      deepLink: 'reznow://apollo',
      relevanceScore: 55,
    },
    {
      id: 'offer_8',
      type: 'travel',
      merchantId: 'makemytrip',
      merchantName: 'MakeMyTrip',
      title: 'Flat ₹500 Off on Flights',
      description: 'Plan your next trip',
      discount: 0,
      cashback: 500,
      expiresAt: new Date(Date.now() + 604800000),
      terms: ['Min booking ₹3000', 'Domestic flights'],
      deepLink: 'reznow://makemytrip',
      relevanceScore: 60,
    },
  ];

  /**
   * Get contextual offers for ride
   */
  async getRideOffers(context: RideContext): Promise<CommerceOffer[]> {
    try {
      const offers = await this.scoreAndRankOffers(context);
      return offers.slice(0, 5); // Return top 5
    } catch (error) {
      this.logger.error(`Error getting offers: ${error}`);
      return [];
    }
  }

  /**
   * Get offers based on destination type
   */
  async getDestinationOffers(context: RideContext): Promise<CommerceOffer[]> {
    const destinationOffers = this.getDestinationBasedOffers(context.destinationType);
    return destinationOffers.slice(0, 3);
  }

  /**
   * Get offers based on user preferences
   */
  async getPersonalizedOffers(context: RideContext): Promise<CommerceOffer[]> {
    const offers: CommerceOffer[] = [];

    // Check user preferences
    if (context.userPreferences?.favoriteBrands) {
      for (const brand of context.userPreferences.favoriteBrands) {
        const brandOffers = this.mockOffers.filter(
          o => o.merchantName.toLowerCase().includes(brand.toLowerCase())
        );
        offers.push(...brandOffers);
      }
    }

    // Time-based offers
    const timeOffers = this.getTimeBasedOffers(context.timeOfDay);
    offers.push(...timeOffers);

    // Rank and return
    return this.scoreAndRankOffers(context, offers).slice(0, 3);
  }

  /**
   * Get offers during ride (real-time)
   */
  async getInRideOffers(context: RideContext): Promise<CommerceOffer[]> {
    const allOffers = [...this.mockOffers];

    // Filter by ETA (show urgent offers for short rides)
    const filteredOffers = allOffers.filter(offer => {
      if (context.eta < 5) {
        // Very short ride - parking, nearby offers only
        return offer.type === 'parking' || offer.type === 'fuel';
      }
      if (context.eta < 15) {
        // Short ride - quick food, coffee
        return ['food', 'coffee', 'parking'].includes(offer.type);
      }
      return true; // Long ride - all offers
    });

    return this.scoreAndRankOffers(context, filteredOffers).slice(0, 4);
  }

  /**
   * Get offers for corporate users
   */
  async getCorporateOffers(context: RideContext): Promise<CommerceOffer[]> {
    // Corporate users get exclusive merchant deals
    const corporateOffers: CommerceOffer[] = [
      {
        id: 'corp_1',
        type: 'food',
        merchantId: 'sodexo',
        merchantName: 'Corporate Café',
        title: 'Sodexo Meal Card Accepted',
        description: 'Use your corporate meal card',
        discount: 10,
        cashback: 0,
        expiresAt: new Date(Date.now() + 86400000),
        terms: ['Sodexo card holders only'],
        deepLink: 'reznow://sodexo',
        relevanceScore: 95,
      },
      {
        id: 'corp_2',
        type: 'travel',
        merchantId: 'redbus',
        merchantName: 'RedBus',
        title: 'Intercity @ 15% Off',
        description: 'Book your next trip',
        discount: 15,
        cashback: 50,
        expiresAt: new Date(Date.now() + 259200000),
        terms: ['Min booking ₹500'],
        deepLink: 'reznow://redbus',
        relevanceScore: 70,
      },
    ];

    return corporateOffers;
  }

  /**
   * Track offer interaction
   */
  async trackOfferInteraction(offerId: string, userId: string, action: 'view' | 'click' | 'redeem'): Promise<void> {
    this.logger.log(`Offer ${offerId} ${action} by user ${userId}`);
    // Would integrate with analytics
  }

  // Private helpers

  private scoreAndRankOffers(context: RideContext, offers?: CommerceOffer[]): CommerceOffer[] {
    const toScore = offers || this.mockOffers;

    const scored = toScore.map(offer => {
      let score = offer.relevanceScore;

      // Boost based on destination
      if (context.destinationType === 'mall' && offer.type === 'shopping') {
        score += 30;
      }
      if (context.destinationType === 'restaurant' && offer.type === 'food') {
        score += 30;
      }
      if (context.destinationType === 'airport' && offer.type === 'travel') {
        score += 25;
      }

      // Boost based on time
      if (context.timeOfDay >= 7 && context.timeOfDay <= 10) {
        // Morning - boost coffee
        if (offer.type === 'coffee') score += 20;
        if (offer.type === 'fuel') score += 15;
      }
      if (context.timeOfDay >= 12 && context.timeOfDay <= 14) {
        // Lunch - boost food
        if (offer.type === 'food') score += 25;
      }
      if (context.timeOfDay >= 18 && context.timeOfDay <= 21) {
        // Evening - boost entertainment, shopping
        if (offer.type === 'entertainment') score += 20;
        if (offer.type === 'shopping') score += 20;
      }

      return { ...offer, relevanceScore: Math.min(score, 100) };
    });

    return scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private getDestinationBasedOffers(destinationType?: string): CommerceOffer[] {
    const mappings: Record<string, string[]> = {
      mall: ['offer_4', 'offer_5', 'offer_1'],
      restaurant: ['offer_1', 'offer_2'],
      airport: ['offer_8', 'offer_6'],
      hospital: ['offer_7'],
      office: ['offer_2', 'offer_3'],
      home: ['offer_3', 'offer_8'],
    };

    const offerIds = destinationType ? mappings[destinationType] || [] : [];
    return this.mockOffers.filter(o => offerIds.includes(o.id));
  }

  private getTimeBasedOffers(hour: number): CommerceOffer[] {
    if (hour >= 6 && hour <= 10) {
      // Morning commute
      return this.mockOffers.filter(o => ['coffee', 'fuel', 'food'].includes(o.type));
    }
    if (hour >= 11 && hour <= 14) {
      // Lunch time
      return this.mockOffers.filter(o => o.type === 'food');
    }
    if (hour >= 17 && hour <= 20) {
      // Evening
      return this.mockOffers.filter(o => ['entertainment', 'shopping', 'food'].includes(o.type));
    }
    return [];
  }
}

export const rideCommerceService = new RideCommerceService();

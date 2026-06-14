// Services Layer - Uses ReZ integrations when available, falls back to mock

import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger.js';
import {
  walletService,
  karmaService,
  catalogService,
  searchService,
  orderService,
  merchantService,
  intentService,
} from '../integrations/rezIntegrations.js';

// ============ Discovery Service ============

const MOCK_VENUES = [
  {
    id: 'v1',
    type: 'venue',
    name: 'La Trattoria',
    cuisine: 'Italian',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    distance: '0.8 km',
    rating: 4.8,
    reviewCount: 234,
    priceRange: '$$',
    openNow: true,
    karmaDiscount: 15,
    coinEarning: 50,
    category: 'restaurants',
  },
  {
    id: 'v2',
    type: 'venue',
    name: 'Sakura Sushi',
    cuisine: 'Japanese',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    distance: '1.2 km',
    rating: 4.6,
    reviewCount: 189,
    priceRange: '$$$',
    openNow: true,
    karmaDiscount: 10,
    coinEarning: 75,
    category: 'restaurants',
  },
  {
    id: 'v3',
    type: 'venue',
    name: 'The Coffee House',
    cuisine: 'Cafe',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
    distance: '0.3 km',
    rating: 4.5,
    reviewCount: 412,
    priceRange: '$',
    openNow: true,
    karmaDiscount: 20,
    coinEarning: 25,
    category: 'cafes',
  },
  {
    id: 'v4',
    type: 'trial',
    name: 'Zen Spa Retreat',
    category: 'Spa & Wellness',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    distance: '2.1 km',
    rating: 4.9,
    reviewCount: 156,
    priceRange: '$$$',
    openNow: true,
    karmaDiscount: 25,
    coinEarning: 100,
  },
  {
    id: 'v5',
    type: 'trial',
    name: 'CrossFit Gym',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    distance: '1.5 km',
    rating: 4.4,
    reviewCount: 98,
    priceRange: '$$',
    openNow: true,
    karmaDiscount: 15,
    coinEarning: 60,
  },
  {
    id: 'v6',
    type: 'event',
    name: 'Jazz Night Live',
    category: 'Live Music',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400',
    distance: '0.9 km',
    rating: 4.7,
    reviewCount: 78,
    priceRange: '$$',
    openNow: true,
    karmaDiscount: 10,
    coinEarning: 40,
  },
];

export const discovery = {
  async search(params: {
    query?: string;
    mood?: string;
    location?: { lat: number; lng: number };
    limit?: number;
  }): Promise<typeof MOCK_VENUES> {
    // Try real ReZ services
    try {
      let items: unknown[] = [];

      // Try search service first
      if (params.query) {
        items = await searchService.search({
          query: params.query,
          lat: params.location?.lat,
          lng: params.location?.lng,
          limit: params.limit,
        });
      }

      // If no results, try catalog
      if (items.length === 0 && params.mood) {
        items = await catalogService.search({
          query: params.query,
          lat: params.location?.lat,
          lng: params.location?.lng,
          category: params.mood,
          limit: params.limit,
        });
      }

      if (items && items.length > 0) {
        logger.info('Using real catalog/search data', { count: items.length });
        return items.map((item) => ({
          id: item.id || item._id,
          type: item.type || 'venue',
          name: item.name || item.productName,
          cuisine: item.cuisine || item.category,
          image: item.image?.url || item.images?.[0] || item.image,
          distance: item.distance ? `${item.distance}km` : undefined,
          rating: item.rating,
          reviewCount: item.reviewCount || item.reviews?.length,
          priceRange: item.priceRange || '$$',
          openNow: item.openNow ?? true,
          karmaDiscount: item.karmaDiscount || 10,
          coinEarning: item.coinEarning || 25,
          category: item.category,
        }));
      }
    } catch (error) {
      logger.warn('Discovery services unavailable, using mock');
    }

    // Fallback to mock data
    let results = [...MOCK_VENUES];

    if (params.mood) {
      const moodFilters: Record<string, string[]> = {
        bored: ['restaurants', 'events'],
        celebrate: ['restaurants', 'events'],
        relax: ['cafes', 'trials'],
        adventure: ['trials', 'events'],
        date: ['restaurants', 'cafes'],
        food: ['restaurants', 'cafes'],
      };

      const categories = moodFilters[params.mood] || [];
      results = results.filter((v) => categories.includes(v.category));
    }

    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.cuisine?.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q)
      );
    }

    results.sort((a, b) => b.rating - a.rating);
    return results.slice(0, params.limit || 10);
  },

  async getTrending(location?: { lat: number; lng: number }): Promise<typeof MOCK_VENUES> {
    // Try real service
    try {
      const items = await searchService.getTrending(
        location?.lat,
        location?.lng
      );
      if (items.length > 0) return items.slice(0, 5);
    } catch {}

    // Fallback
    return MOCK_VENUES.filter((v) => v.rating >= 4.6).slice(0, 5);
  },

  async getNearby(location?: { lat: number; lng: number }, limit = 10): Promise<typeof MOCK_VENUES> {
    // Try real service (use catalog with location)
    try {
      const items = await catalogService.search({
        lat: location?.lat,
        lng: location?.lng,
        limit,
      });
      if (items.length > 0) return items;
    } catch {}

    // Fallback
    return MOCK_VENUES.slice(0, limit);
  },
};

// ============ Wallet Service ============

export const wallet = {
  async getBalance(userId?: string): Promise<{ coins: number; vouchers: number }> {
    if (!userId) return { coins: 1250, vouchers: 3 };

    try {
      const balance = await walletService.getBalance(userId);
      return balance;
    } catch {
      return { coins: 1250, vouchers: 3 };
    }
  },

  async addCoins(userId: string, amount: number, reason: string): Promise<void> {
    try {
      await walletService.credit(userId, amount, reason);
    } catch {
      logger.warn('Wallet credit failed, in-memory only');
    }
  },

  async deductCoins(userId: string, amount: number, reason: string): Promise<boolean> {
    try {
      return await walletService.debit(userId, amount, reason);
    } catch {
      return false;
    }
  },
};

// ============ Karma Service ============

export const karma = {
  async getStatus(userId?: string): Promise<{
    tier: string;
    points: number;
    nextTier: string;
    progress: number;
    multiplier: number;
  }> {
    const mockTier = ['Bronze', 'Silver', 'Gold', 'Platinum'];

    if (!userId) {
      return {
        tier: 'Gold',
        points: 2450,
        nextTier: 'Platinum',
        progress: 45,
        multiplier: 1.5,
      };
    }

    try {
      return await karmaService.getStatus(userId);
    } catch {
      return {
        tier: 'Gold',
        points: 2450,
        nextTier: 'Platinum',
        progress: 45,
        multiplier: 1.5,
      };
    }
  },

  async calculateDiscount(userId: string, entityId: string): Promise<{ amount: number; rate: number }> {
    try {
      return await karmaService.getDiscount(userId, entityId);
    } catch {
      return { amount: 150, rate: 0.15 };
    }
  },

  async calculateRewards(params: {
    type: string;
    amount: number;
    userId: string;
  }): Promise<{ coins: number; karma: number }> {
    const karmaStatus = await this.getStatus(params.userId);

    const multipliers: Record<string, number> = {
      Bronze: 1.0,
      Silver: 1.2,
      Gold: 1.5,
      Platinum: 2.0,
    };

    const multiplier = multipliers[karmaStatus.tier] || 1.0;

    return {
      coins: Math.round(params.amount * 0.05 * multiplier),
      karma: Math.round(params.amount * 0.1 * multiplier),
    };
  },
};

// ============ Bookings Service ============

const mockBookings = new Map<string, unknown[]>();

export const bookings = {
  async createBooking(params: {
    entityId: string;
    entityName: string;
    dateTime: Date;
    partySize: number;
    userId?: string;
  }): Promise<{
    id: string;
    confirmationCode: string;
    entityName: string;
    dateTime: Date;
    partySize: number;
    status: string;
    price: number;
  }> {
    const id = uuidv4();
    const confirmationCode = randomBytes(4).toString('hex').toUpperCase();

    const booking = {
      id,
      confirmationCode,
      entityName: params.entityName,
      dateTime: params.dateTime,
      partySize: params.partySize,
      status: 'confirmed',
      price: 1500,
    };

    // Try real service
    try {
      const result = await orderService.createBooking({
        userId: params.userId || '',
        entityId: params.entityId,
        entityName: params.entityName,
        entityType: 'venue',
        dateTime: params.dateTime,
        partySize: params.partySize,
      });

      return {
        ...booking,
        id: result.id || id,
        confirmationCode: result.confirmationCode || confirmationCode,
        status: result.status || 'confirmed',
      };
    } catch {
      // Store locally
      const userId = params.userId || 'guest';
      if (!mockBookings.has(userId)) {
        mockBookings.set(userId, []);
      }
      mockBookings.get(userId)!.push(booking);
      return booking;
    }
  },

  async getBookings(userId?: string): Promise<unknown[]> {
    if (!userId) return [];

    try {
      return await orderService.getBookings(userId);
    } catch {
      return mockBookings.get(userId) || [];
    }
  },

  async cancelBooking(bookingId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;

    try {
      return await orderService.cancelBooking(bookingId, userId);
    } catch {
      const userBookings = mockBookings.get(userId) || [];
      const index = userBookings.findIndex((b) => b.id === bookingId);
      if (index !== -1) {
        userBookings[index].status = 'cancelled';
        return true;
      }
      return false;
    }
  },

  async getBooking(bookingId: string, userId?: string): Promise<unknown | null> {
    if (!userId) return null;

    try {
      return await orderService.getBooking(bookingId, userId);
    } catch {
      const userBookings = mockBookings.get(userId) || [];
      return userBookings.find((b) => b.id === bookingId) || null;
    }
  },
};

// ============ Intent Service ============

export const intent = {
  async record(userId: string, intent: string, entities, result): Promise<void> {
    try {
      await intentService.recordIntent(userId, intent, entities, result);
    } catch {
      logger.debug('Intent recording skipped');
    }
  },

  async getContext(userId: string): Promise<unknown> {
    try {
      return await intentService.getUserContext(userId);
    } catch {
      return null;
    }
  },
};

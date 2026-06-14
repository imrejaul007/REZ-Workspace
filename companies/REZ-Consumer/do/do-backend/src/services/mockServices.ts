// Mock services - Replace these with actual ReZ service calls

import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

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

export const mockDiscovery = {
  async search(params: {
    query?: string;
    mood?: string;
    location?: { lat: number; lng: number };
    limit?: number;
  }): Promise<typeof MOCK_VENUES> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 200));

    let results = [...MOCK_VENUES];

    // Filter by mood
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

    // Filter by query
    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.cuisine?.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q)
      );
    }

    // Sort by rating
    results.sort((a, b) => b.rating - a.rating);

    // Limit
    return results.slice(0, params.limit || 10);
  },

  async getTrending(location?: { lat: number; lng: number }): Promise<typeof MOCK_VENUES> {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_VENUES.filter((v) => v.rating >= 4.6).slice(0, 5);
  },

  async getNearby(location?: { lat: number; lng: number }, limit = 10): Promise<typeof MOCK_VENUES> {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_VENUES.slice(0, limit);
  },
};

// ============ Wallet Service ============

const mockWallets = new Map<string, { coins: number; vouchers: number }>();
const mockTransactions = new Map<string, unknown[]>();

export const mockWallet = {
  async getWallet(userId?: string): Promise<{ coins: number; vouchers: number }> {
    await new Promise((r) => setTimeout(r, 100));

    const id = userId || 'guest';
    if (!mockWallets.has(id)) {
      mockWallets.set(id, { coins: 1250, vouchers: 3 });
    }

    return mockWallets.get(id)!;
  },

  async addCoins(userId: string, amount: number, reason: string): Promise<void> {
    const wallet = await this.getWallet(userId);
    wallet.coins += amount;

    // Record transaction
    if (!mockTransactions.has(userId)) {
      mockTransactions.set(userId, []);
    }
    mockTransactions.get(userId)!.push({
      id: uuidv4(),
      type: 'earned',
      amount,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  async deductCoins(userId: string, amount: number, reason: string): Promise<boolean> {
    const wallet = await this.getWallet(userId);

    if (wallet.coins < amount) {
      return false;
    }

    wallet.coins -= amount;

    if (!mockTransactions.has(userId)) {
      mockTransactions.set(userId, []);
    }
    mockTransactions.get(userId)!.push({
      id: uuidv4(),
      type: 'spent',
      amount,
      reason,
      timestamp: new Date().toISOString(),
    });

    return true;
  },
};

// ============ Loyalty/Karma Service ============

const mockKarma = new Map<string, { tier: string; points: number; nextTier: string }>();

export const mockLoyalty = {
  async getStatus(userId?: string): Promise<{
    tier: string;
    points: number;
    nextTier: string;
    progress: number;
  }> {
    await new Promise((r) => setTimeout(r, 100));

    const id = userId || 'guest';
    if (!mockKarma.has(id)) {
      mockKarma.set(id, { tier: 'Gold', points: 2450, nextTier: 'Platinum' });
    }

    const karma = mockKarma.get(id)!;
    const progress = Math.min(100, (karma.points % 1000) / 10);

    return {
      ...karma,
      progress,
    };
  },

  async calculateDiscount(userId: string, entityId: string): Promise<{ amount: number; rate: number }> {
    const karma = await this.getStatus(userId);

    const rates: Record<string, number> = {
      Bronze: 0.05,
      Silver: 0.10,
      Gold: 0.15,
      Platinum: 0.20,
    };

    const rate = rates[karma.tier] || 0.05;
    const basePrice = 1000; // Mock base price
    const amount = Math.round(basePrice * rate);

    return { amount, rate };
  },

  async calculateRewards(params: {
    type: string;
    amount: number;
    userId: string;
  }): Promise<{ coins: number; karma: number }> {
    const karma = await this.getStatus(params.userId);

    // Higher tier = more rewards
    const multipliers: Record<string, number> = {
      Bronze: 1.0,
      Silver: 1.2,
      Gold: 1.5,
      Platinum: 2.0,
    };

    const multiplier = multipliers[karma.tier] || 1.0;

    return {
      coins: Math.round(params.amount * 0.05 * multiplier),
      karma: Math.round(params.amount * 0.1 * multiplier),
    };
  },
};

// ============ Bookings Service ============

export const mockBookings = {
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
    await new Promise((r) => setTimeout(r, 300));

    const booking = {
      id: uuidv4(),
      confirmationCode: randomBytes(4).toString('hex').toUpperCase(),
      entityName: params.entityName,
      dateTime: params.dateTime,
      partySize: params.partySize,
      status: 'confirmed',
      price: 1500,
    };

    const id = params.userId || 'guest';
    if (!mockBookings.has(id)) {
      mockBookings.set(id, []);
    }
    mockBookings.get(id)!.push(booking);

    return booking;
  },

  async getBookings(userId?: string): Promise<unknown[]> {
    await new Promise((r) => setTimeout(r, 150));

    const id = userId || 'guest';
    return mockBookings.get(id) || [];
  },

  async cancelBooking(bookingId: string, userId?: string): Promise<boolean> {
    const id = userId || 'guest';
    const bookings = mockBookings.get(id) || [];
    const index = bookings.findIndex((b) => b.id === bookingId);

    if (index === -1) {
      return false;
    }

    bookings[index].status = 'cancelled';
    return true;
  },
};

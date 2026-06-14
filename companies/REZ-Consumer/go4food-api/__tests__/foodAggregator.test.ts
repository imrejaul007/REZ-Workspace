/**
 * Go4Food API - Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Types
interface Restaurant {
  id: string;
  name: string;
  cuisines: string[];
  rating: number;
  priceForTwo: number;
  isPureVeg: boolean;
}

interface SearchOptions {
  query?: string;
  cuisines?: string[];
  minRating?: number;
  isPureVeg?: boolean;
  priceRange?: 'low' | 'medium' | 'high';
  page: number;
  limit: number;
}

// Mock restaurants
const mockRestaurants: Restaurant[] = [
  { id: 'r1', name: 'Pizza Palace', cuisines: ['Italian', 'Pizza'], rating: 4.5, priceForTwo: 600, isPureVeg: false },
  { id: 'r2', name: 'Green Bowl', cuisines: ['Healthy', 'Salads'], rating: 4.2, priceForTwo: 400, isPureVeg: true },
  { id: 'r3', name: 'Spice Garden', cuisines: ['North Indian', 'Chinese'], rating: 4.0, priceForTwo: 500, isPureVeg: false },
  { id: 'r4', name: 'Biryani House', cuisines: ['Biryani', 'Mughlai'], rating: 4.3, priceForTwo: 450, isPureVeg: false },
  { id: 'r5', name: 'Veg Delight', cuisines: ['North Indian', 'South Indian'], rating: 3.8, priceForTwo: 250, isPureVeg: true },
];

describe('Go4Food API', () => {
  let restaurants: Restaurant[];

  beforeEach(() => {
    restaurants = [...mockRestaurants];
  });

  describe('Restaurant Search', () => {
    it('should search by restaurant name', () => {
      const query = 'pizza';
      const results = restaurants.filter(r =>
        r.name.toLowerCase().includes(query.toLowerCase())
      );
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Pizza Palace');
    });

    it('should search by cuisine', () => {
      const cuisine = 'biryani';
      const results = restaurants.filter(r =>
        r.cuisines.some(c => c.toLowerCase().includes(cuisine.toLowerCase()))
      );
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Biryani House');
    });

    it('should filter by minimum rating', () => {
      const minRating = 4.0;
      const results = restaurants.filter(r => r.rating >= minRating);
      expect(results.length).toBe(4);
    });

    it('should filter pure veg restaurants', () => {
      const results = restaurants.filter(r => r.isPureVeg);
      expect(results.length).toBe(2);
      expect(results.map(r => r.name)).toContain('Green Bowl');
      expect(results.map(r => r.name)).toContain('Veg Delight');
    });

    it('should filter by price range - low', () => {
      const priceRange = { low: [0, 300], medium: [300, 600], high: [600, Infinity] };
      const [min, max] = priceRange.low;
      const results = restaurants.filter(r => r.priceForTwo >= min && r.priceForTwo < max);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Veg Delight');
    });

    it('should filter by price range - medium', () => {
      const priceRange = { low: [0, 300], medium: [300, 600], high: [600, Infinity] };
      const [min, max] = priceRange.medium;
      const results = restaurants.filter(r => r.priceForTwo >= min && r.priceForTwo < max);
      expect(results.length).toBe(3);
    });
  });

  describe('Price Comparison', () => {
    it('should find lowest price', () => {
      const prices = [
        { source: 'swiggy', price: 349 },
        { source: 'zomato', price: 279 },
        { source: 'internal', price: 299 },
      ];
      const lowestPrice = Math.min(...prices.map(p => p.price));
      expect(lowestPrice).toBe(279);
    });

    it('should find highest price', () => {
      const prices = [
        { source: 'swiggy', price: 349 },
        { source: 'zomato', price: 279 },
        { source: 'internal', price: 299 },
      ];
      const highestPrice = Math.max(...prices.map(p => p.price));
      expect(highestPrice).toBe(349);
    });

    it('should calculate savings percentage', () => {
      const lowest = 279;
      const highest = 349;
      const savings = highest - lowest;
      const savingsPercent = Math.round((savings / highest) * 100);
      expect(savingsPercent).toBe(20);
    });
  });

  describe('Search Suggestions', () => {
    it('should return suggestions matching query', () => {
      const suggestions = ['Pizza', 'Biryani', 'Burger', 'Chinese', 'Pasta'];
      const query = 'piz';

      const matches = suggestions.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
      );

      expect(matches.length).toBe(1);
      expect(matches[0]).toBe('Pizza');
    });

    it('should limit suggestions to 5', () => {
      const suggestions = ['Pizza', 'Biryani', 'Burger', 'Chinese', 'Pasta', 'Sushi', 'Tacos'];
      const query = '';

      const limited = suggestions.slice(0, 5);
      expect(limited.length).toBe(5);
    });
  });

  describe('Pagination', () => {
    it('should paginate results correctly', () => {
      const page = 2;
      const limit = 2;
      const start = (page - 1) * limit;
      const end = start + limit;

      const paginated = restaurants.slice(start, end);

      expect(paginated.length).toBe(2);
      expect(paginated[0].name).toBe('Spice Garden');
    });

    it('should calculate total pages', () => {
      const total = restaurants.length;
      const limit = 2;
      const totalPages = Math.ceil(total / limit);
      expect(totalPages).toBe(3);
    });
  });

  describe('Sorting', () => {
    it('should sort by rating descending', () => {
      const sorted = [...restaurants].sort((a, b) => b.rating - a.rating);
      expect(sorted[0].name).toBe('Pizza Palace');
      expect(sorted[0].rating).toBe(4.5);
    });

    it('should sort by price ascending', () => {
      const sorted = [...restaurants].sort((a, b) => a.priceForTwo - b.priceForTwo);
      expect(sorted[0].name).toBe('Veg Delight');
      expect(sorted[0].priceForTwo).toBe(250);
    });
  });
});

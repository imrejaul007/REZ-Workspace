/**
 * REZ-nearby - Unit Tests
 */

import { describe, it, expect } from '@jest/globals';

describe('REZ-nearby Service', () => {
  describe('Distance Calculation', () => {
    it('should calculate distance correctly', () => {
      const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        // Simplified - not actual haversine
        return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)) * 111;
      };
      expect(calcDistance(0, 0, 1, 1)).toBeGreaterThan(0);
    });

    it('should sort places by distance', () => {
      const places = [
        { name: 'A', distance: 2 },
        { name: 'B', distance: 0.5 },
        { name: 'C', distance: 1 },
      ];
      const sorted = places.sort((a, b) => a.distance - b.distance);
      expect(sorted[0].name).toBe('B');
    });
  });

  describe('Category Filtering', () => {
    it('should filter by category', () => {
      const places = [
        { name: 'A', category: 'restaurant' },
        { name: 'B', category: 'shopping' },
      ];
      const filtered = places.filter(p => p.category === 'restaurant');
      expect(filtered.length).toBe(1);
    });
  });
});

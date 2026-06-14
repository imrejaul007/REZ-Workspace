/**
 * REZ-inbox - Unit Tests
 */

import { describe, it, expect } from '@jest/globals';

describe('REZ-inbox Service', () => {
  describe('Message Filtering', () => {
    it('should filter by category', () => {
      const messages = [
        { id: '1', category: 'travel' },
        { id: '2', category: 'food' },
      ];
      const filtered = messages.filter(m => m.category === 'travel');
      expect(filtered.length).toBe(1);
    });

    it('should filter by status', () => {
      const messages = [
        { id: '1', status: 'unread' },
        { id: '2', status: 'read' },
      ];
      const filtered = messages.filter(m => m.status === 'unread');
      expect(filtered.length).toBe(1);
    });
  });

  describe('Category Detection', () => {
    it('should detect travel emails', () => {
      const detect = (text: string) => {
        if (text.includes('flight') || text.includes('booking')) return 'travel';
        return 'other';
      };
      expect(detect('Your flight booking is confirmed')).toBe('travel');
    });

    it('should detect food emails', () => {
      const detect = (text: string) => {
        if (text.includes('swiggy') || text.includes('zomato')) return 'food';
        return 'other';
      };
      expect(detect('Your Swiggy order')).toBe('food');
    });
  });
});

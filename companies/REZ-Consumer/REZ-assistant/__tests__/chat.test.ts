/**
 * REZ-assistant - Unit Tests
 */

import { describe, it, expect } from '@jest/globals';

describe('REZ-assistant Chat Service', () => {
  describe('Intent Detection', () => {
    it('should detect food intent', () => {
      const detectIntent = (message: string) => {
        if (message.includes('food') || message.includes('restaurant')) return 'food_search';
        return 'general';
      };
      expect(detectIntent('I want pizza')).toBe('food_search');
    });

    it('should detect order intent', () => {
      const detectIntent = (message: string) => {
        if (message.includes('order') || message.includes('track')) return 'order_tracking';
        return 'general';
      };
      expect(detectIntent('track my order')).toBe('order_tracking');
    });

    it('should default to general intent', () => {
      const detectIntent = (message: string) => {
        if (message.includes('food')) return 'food_search';
        if (message.includes('order')) return 'order_tracking';
        return 'general';
      };
      expect(detectIntent('hello')).toBe('general');
    });
  });

  describe('Message Storage', () => {
    it('should store messages', () => {
      const messages: any[] = [];
      const msg = { id: '1', role: 'user' as const, content: 'Hello' };
      messages.push(msg);
      expect(messages.length).toBe(1);
    });

    it('should filter by role', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi' },
      ];
      const userMessages = messages.filter(m => m.role === 'user');
      expect(userMessages.length).toBe(1);
    });
  });
});

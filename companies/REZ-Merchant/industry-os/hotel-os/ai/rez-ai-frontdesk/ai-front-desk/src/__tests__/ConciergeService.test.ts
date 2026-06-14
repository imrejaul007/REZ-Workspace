/**
 * ConciergeService Tests
 */

import { ConciergeService } from '../services/ConciergeService';

describe('ConciergeService', () => {
  let conciergeService: ConciergeService;

  beforeEach(() => {
    conciergeService = new ConciergeService();
  });

  describe('processQuery', () => {
    it('should respond to checkout queries', () => {
      const result = conciergeService.processQuery('I want to check out');
      expect(result.response).toContain('check out');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should respond to wifi queries', () => {
      const result = conciergeService.processQuery('What is the wifi password?');
      expect(result.response).toContain('WiFi');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should respond to restaurant queries', () => {
      const result = conciergeService.processQuery('Where is the restaurant?');
      expect(result.response).toContain('restaurant');
      expect(result.confidence).toBeGreaterThan(0.85);
    });

    it('should respond to transport queries', () => {
      const result = conciergeService.processQuery('I need a taxi to the airport');
      expect(result.response).toContain('transportation');
      expect(result.confidence).toBeGreaterThan(0.85);
    });

    it('should respond to amenities queries', () => {
      const result = conciergeService.processQuery('When is the pool open?');
      expect(result.response).toContain('Pool');
      expect(result.confidence).toBeGreaterThan(0.85);
    });

    it('should respond to room service queries', () => {
      const result = conciergeService.processQuery('I need extra towels');
      expect(result.response).toContain('room service');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should respond to emergency queries', () => {
      const result = conciergeService.processQuery('I need a doctor');
      expect(result.response).toContain('emergency');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should return default response for unknown queries', () => {
      const result = conciergeService.processQuery('Hello how are you?');
      expect(result.confidence).toBeLessThanOrEqual(0.5);
      expect(result.suggestions).toBeDefined();
    });

    it('should handle case-insensitive queries', () => {
      const result1 = conciergeService.processQuery('CHECKOUT');
      const result2 = conciergeService.processQuery('checkout');
      expect(result1.confidence).toBe(result2.confidence);
    });

    it('should include suggestions in response', () => {
      const result = conciergeService.processQuery('wifi password');
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('getGreeting', () => {
    it('should return a greeting message', () => {
      const greeting = conciergeService.getGreeting();
      expect(greeting).toBeDefined();
      expect(typeof greeting).toBe('string');
      expect(greeting.length).toBeGreaterThan(0);
    });
  });

  describe('getWelcomeMessage', () => {
    it('should return a welcome message with suggestions', () => {
      const result = conciergeService.getWelcomeMessage();
      expect(result.response).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.confidence).toBe(1.0);
    });

    it('should include concierge capabilities in welcome', () => {
      const result = conciergeService.getWelcomeMessage();
      expect(result.response).toContain('concierge');
    });
  });
});
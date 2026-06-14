import { generateUUID, generatePublisherId, generatePlacementId, generateEventId, generateAPIKey, calculateCTR, calculateEarnings, formatCurrency, validateUrl } from '../utils/helpers.js';

describe('Helper Functions', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('generatePublisherId', () => {
    it('should generate a publisher ID with prefix', () => {
      const publisherId = generatePublisherId();
      expect(publisherId).toMatch(/^pub_[0-9a-f-]+$/);
    });
  });

  describe('generatePlacementId', () => {
    it('should generate a placement ID with prefix', () => {
      const placementId = generatePlacementId();
      expect(placementId).toMatch(/^plc_[0-9a-f-]+$/);
    });
  });

  describe('generateEventId', () => {
    it('should generate an event ID with prefix', () => {
      const eventId = generateEventId();
      expect(eventId).toMatch(/^evt_[0-9a-f-]+$/);
    });
  });

  describe('generateAPIKey', () => {
    it('should generate an API key with sk_ prefix', () => {
      const apiKey = generateAPIKey();
      expect(apiKey).toMatch(/^sk_[A-Za-z0-9]+$/);
    });

    it('should generate API key with 35 characters total', () => {
      const apiKey = generateAPIKey();
      expect(apiKey.length).toBe(35);
    });
  });

  describe('calculateCTR', () => {
    it('should calculate CTR correctly', () => {
      expect(calculateCTR(100, 10000)).toBe(1);
    });

    it('should return 0 for zero impressions', () => {
      expect(calculateCTR(10, 0)).toBe(0);
    });

    it('should handle decimal results', () => {
      expect(calculateCTR(1, 1000)).toBe(0.1);
    });
  });

  describe('calculateEarnings', () => {
    it('should calculate earnings correctly', () => {
      // 10000 impressions / 1000 * $2 CPM * 0.70 payout rate = $14
      const earnings = calculateEarnings(10000, 2, 0.70);
      expect(earnings).toBe(14);
    });

    it('should return 0 for zero impressions', () => {
      expect(calculateEarnings(0, 2, 0.70)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const formatted = formatCurrency(1234.56, 'USD');
      expect(formatted).toBe('$1,234.56');
    });

    it('should format with default USD', () => {
      const formatted = formatCurrency(100);
      expect(formatted).toBe('$100.00');
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://localhost:3000')).toBe(true);
      expect(validateUrl('https://subdomain.example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('')).toBe(false);
      expect(validateUrl('htp://wrong')).toBe(false);
    });
  });
});
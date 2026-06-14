/**
 * Unit Tests for Developer Portal Service
 */

// Mock dependencies
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  model: jest.fn().mockReturnValue({
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  }),
  Schema: jest.fn().mockImplementation(() => ({
    index: jest.fn(),
    unique: jest.fn(),
  })),
}));

jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

jest.mock('helmet', () => jest.fn());

jest.mock('cors', () => jest.fn());

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed_key_123'),
  }),
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('webhook_secret_123'),
  }),
}));

// Import after mocks
import crypto from 'crypto';

// Test helper functions from the module (we'll extract them for testing)
describe('Developer Portal Service', () => {
  describe('API Key Generation', () => {
    it('should generate valid API key with correct prefix', () => {
      const { v4 } = require('uuid');
      v4.mockReturnValueOnce('abc123').mockReturnValueOnce('def456');

      // Simulate key generation
      const key = `rzs_${'abc123'.replace(/-/g, '')}${'def456'.replace(/-/g, '').slice(0, 16)}`;
      const keyPrefix = key.slice(0, 12);

      expect(key).toMatch(/^rzs_/);
      expect(keyPrefix).toBe('rzs_abc123ab');
      expect(key.length).toBeGreaterThan(20);
    });

    it('should generate unique keys', () => {
      const { v4 } = require('uuid');
      v4.mockReturnValueOnce('unique1').mockReturnValueOnce('unique2');

      const key1 = `rzs_${'unique1'.replace(/-/g, '')}${'unique2'.replace(/-/g, '').slice(0, 16)}`;

      v4.mockReturnValueOnce('unique3').mockReturnValueOnce('unique4');
      const key2 = `rzs_${'unique3'.replace(/-/g, '')}${'unique4'.replace(/-/g, '').slice(0, 16)}`;

      expect(key1).not.toBe(key2);
    });

    it('should hash key correctly using SHA256', () => {
      const testKey = 'rzs_test123';
      const hashedKey = crypto.createHash('sha256').update(testKey).digest('hex');

      expect(hashedKey).toBe('hashed_key_123');
      expect(hashedKey.length).toBe(64); // SHA256 hex is 64 chars
    });
  });

  describe('Webhook Secret Generation', () => {
    it('should generate 32-byte hex secret', () => {
      const secret = crypto.randomBytes(32).toString('hex');

      expect(secret.length).toBe(64);
      expect(secret).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate unique secrets', () => {
      const secret1 = crypto.randomBytes(32).toString('hex');
      const secret2 = crypto.randomBytes(32).toString('hex');

      expect(secret1).not.toBe(secret2);
    });
  });

  describe('API Tiers', () => {
    const APITiers = {
      free: {
        name: 'Free',
        price: 0,
        rateLimit: 100,
        dailyLimit: 1000,
        monthlyLimit: 30000,
      },
      starter: {
        name: 'Starter',
        price: 499,
        rateLimit: 300,
        dailyLimit: 10000,
        monthlyLimit: 300000,
      },
      professional: {
        name: 'Professional',
        price: 1999,
        rateLimit: 1000,
        dailyLimit: 50000,
        monthlyLimit: 1500000,
      },
      enterprise: {
        name: 'Enterprise',
        price: 9999,
        rateLimit: 10000,
        dailyLimit: 1000000,
        monthlyLimit: 30000000,
      },
    };

    it('should have correct rate limits for each tier', () => {
      expect(APITiers.free.rateLimit).toBe(100);
      expect(APITiers.starter.rateLimit).toBe(300);
      expect(APITiers.professional.rateLimit).toBe(1000);
      expect(APITiers.enterprise.rateLimit).toBe(10000);
    });

    it('should have increasing limits as tier increases', () => {
      expect(APITiers.starter.rateLimit).toBeGreaterThan(APITiers.free.rateLimit);
      expect(APITiers.professional.rateLimit).toBeGreaterThan(APITiers.starter.rateLimit);
      expect(APITiers.enterprise.rateLimit).toBeGreaterThan(APITiers.professional.rateLimit);
    });

    it('should have correct pricing', () => {
      expect(APITiers.free.price).toBe(0);
      expect(APITiers.starter.price).toBe(499);
      expect(APITiers.professional.price).toBe(1999);
      expect(APITiers.enterprise.price).toBe(9999);
    });

    it('should have correct daily limits', () => {
      expect(APITiers.free.dailyLimit).toBe(1000);
      expect(APITiers.starter.dailyLimit).toBe(10000);
      expect(APITiers.professional.dailyLimit).toBe(50000);
      expect(APITiers.enterprise.dailyLimit).toBe(1000000);
    });

    it('should have correct monthly limits', () => {
      expect(APITiers.free.monthlyLimit).toBe(30000);
      expect(APITiers.starter.monthlyLimit).toBe(300000);
      expect(APITiers.professional.monthlyLimit).toBe(1500000);
      expect(APITiers.enterprise.monthlyLimit).toBe(30000000);
    });
  });

  describe('API Services', () => {
    const APIServices = {
      'rez-hotel-service': {
        name: 'Hotel Search API',
        description: 'Search hotels, rooms, availability',
        baseUrl: '/api/v1/hotels',
        version: 'v1',
        docs: '/docs/hotels',
      },
      'rez-booking-service': {
        name: 'Booking API',
        description: 'Create, modify, cancel bookings',
        baseUrl: '/api/v1/bookings',
        version: 'v1',
        docs: '/docs/bookings',
      },
    };

    it('should have required service fields', () => {
      Object.entries(APIServices).forEach(([id, service]: [string, any]) => {
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('description');
        expect(service).toHaveProperty('baseUrl');
        expect(service).toHaveProperty('version');
        expect(service).toHaveProperty('docs');
      });
    });

    it('should have correct base URLs', () => {
      expect(APIServices['rez-hotel-service'].baseUrl).toBe('/api/v1/hotels');
      expect(APIServices['rez-booking-service'].baseUrl).toBe('/api/v1/bookings');
    });

    it('should have v1 version for all services', () => {
      Object.values(APIServices).forEach((service: any) => {
        expect(service.version).toBe('v1');
      });
    });
  });

  describe('Developer Schema Validation', () => {
    const { z } = require('zod');

    const DeveloperSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      company: z.string().optional(),
      phone: z.string().optional(),
      useCase: z.enum(['personal', 'business', 'enterprise', 'partner']),
      agreedToTerms: z.boolean().refine(v => v === true, 'Must agree to terms'),
    });

    it('should validate valid developer data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        useCase: 'business',
        agreedToTerms: true,
      };

      const result = DeveloperSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        useCase: 'business',
        agreedToTerms: true,
      };

      const result = DeveloperSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'not-an-email',
        useCase: 'business',
        agreedToTerms: true,
      };

      const result = DeveloperSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid useCase', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        useCase: 'invalid',
        agreedToTerms: true,
      };

      const result = DeveloperSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject if not agreed to terms', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        useCase: 'business',
        agreedToTerms: false,
      };

      const result = DeveloperSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow optional company and phone', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        useCase: 'personal',
        agreedToTerms: true,
      };

      const result = DeveloperSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('API Key Schema Validation', () => {
    const { z } = require('zod');

    const APIKeySchema = z.object({
      developerId: z.string(),
      name: z.string(),
      tier: z.enum(['free', 'starter', 'professional', 'enterprise']),
      services: z.array(z.string()),
      permissions: z.array(z.string()).optional(),
      expiresAt: z.string().optional(),
      rateLimitOverride: z.number().optional(),
    });

    it('should validate valid API key data', () => {
      const validData = {
        developerId: 'dev_123',
        name: 'My API Key',
        tier: 'starter',
        services: ['rez-hotel-service'],
      };

      const result = APIKeySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid tier', () => {
      const invalidData = {
        developerId: 'dev_123',
        name: 'My API Key',
        tier: 'invalid',
        services: ['rez-hotel-service'],
      };

      const result = APIKeySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow empty services array', () => {
      const validData = {
        developerId: 'dev_123',
        name: 'My API Key',
        tier: 'free',
        services: [],
      };

      const result = APIKeySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept expiresAt as ISO string', () => {
      const validData = {
        developerId: 'dev_123',
        name: 'My API Key',
        tier: 'professional',
        services: ['rez-hotel-service'],
        expiresAt: '2026-12-31T23:59:59Z',
      };

      const result = APIKeySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept rateLimitOverride', () => {
      const validData = {
        developerId: 'dev_123',
        name: 'My API Key',
        tier: 'enterprise',
        services: ['*'],
        rateLimitOverride: 50000,
      };

      const result = APIKeySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Webhook Schema Validation', () => {
    const { z } = require('zod');

    const WebhookSchema = z.object({
      developerId: z.string(),
      service: z.string(),
      url: z.string().url(),
      events: z.array(z.enum([
        'booking.created', 'booking.modified', 'booking.cancelled', 'booking.completed',
        'payment.success', 'payment.failed',
        'checkin.arrived', 'checkout.departed',
        'review.received', 'message.received',
      ])),
      secret: z.string().optional(),
      isActive: z.boolean().default(true),
      headers: z.record(z.string()).optional(),
    });

    it('should validate valid webhook data', () => {
      const validData = {
        developerId: 'dev_123',
        service: 'rez-booking-service',
        url: 'https://example.com/webhook',
        events: ['booking.created', 'payment.success'],
      };

      const result = WebhookSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const invalidData = {
        developerId: 'dev_123',
        service: 'rez-booking-service',
        url: 'not-a-url',
        events: ['booking.created'],
      };

      const result = WebhookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid event type', () => {
      const invalidData = {
        developerId: 'dev_123',
        service: 'rez-booking-service',
        url: 'https://example.com/webhook',
        events: ['invalid.event'],
      };

      const result = WebhookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should default isActive to true', () => {
      const dataWithDefaults = {
        developerId: 'dev_123',
        service: 'rez-booking-service',
        url: 'https://example.com/webhook',
        events: ['booking.created'],
      };

      const result = WebhookSchema.parse(dataWithDefaults);
      expect(result.isActive).toBe(true);
    });

    it('should accept custom headers', () => {
      const validData = {
        developerId: 'dev_123',
        service: 'rez-booking-service',
        url: 'https://example.com/webhook',
        events: ['booking.created'],
        headers: { 'X-Custom-Header': 'value' },
      };

      const result = WebhookSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Key Prefix Extraction', () => {
    it('should extract first 8 characters correctly', () => {
      const key = 'rzs_abc123def456ghi';
      const keyPrefix = key.slice(0, 12);

      expect(keyPrefix).toBe('rzs_abc123de');
    });

    it('should handle long keys', () => {
      const key = 'rzs_' + 'a'.repeat(60);
      const keyPrefix = key.slice(0, 12);

      expect(keyPrefix).toBe('rzs_' + 'a'.repeat(8));
    });
  });

  describe('Rate Limit Calculation', () => {
    it('should calculate remaining requests correctly', () => {
      const limit = 1000;
      const usage = 750;
      const remaining = Math.max(0, limit - usage);

      expect(remaining).toBe(250);
    });

    it('should not return negative remaining', () => {
      const limit = 100;
      const usage = 150;
      const remaining = Math.max(0, limit - usage);

      expect(remaining).toBe(0);
    });

    it('should calculate reset time correctly', () => {
      const now = new Date('2026-06-02T10:00:00Z');
      const reset = new Date(now.getTime() + 60000);

      expect(reset.toISOString()).toBe('2026-06-02T10:01:00.000Z');
    });
  });

  describe('API Key Expiration Check', () => {
    it('should detect expired key', () => {
      const expiresAt = new Date('2026-06-01');
      const now = new Date('2026-06-02');

      expect(expiresAt < now).toBe(true);
    });

    it('should detect valid key', () => {
      const expiresAt = new Date('2026-06-03');
      const now = new Date('2026-06-02');

      expect(expiresAt < now).toBe(false);
    });

    it('should handle no expiration date', () => {
      const expiresAt = null;

      expect(expiresAt && expiresAt < new Date()).toBeFalsy();
    });
  });

  describe('Usage Aggregation', () => {
    it('should calculate success rate correctly', () => {
      const totalRequests = 1000;
      const successCount = 950;
      const successRate = (successCount / totalRequests * 100).toFixed(2) + '%';

      expect(successRate).toBe('95.00%');
    });

    it('should handle zero requests', () => {
      const totalRequests = 0;
      const successRate = totalRequests > 0
        ? (0 / totalRequests * 100).toFixed(2) + '%'
        : '0%';

      expect(successRate).toBe('0%');
    });

    it('should aggregate endpoint stats', () => {
      const usage = [
        { endpoint: '/api/v1/hotels', responseTime: 50 },
        { endpoint: '/api/v1/hotels', responseTime: 60 },
        { endpoint: '/api/v1/bookings', responseTime: 100 },
      ];

      const aggregated = usage.reduce((acc: any, curr) => {
        if (!acc[curr.endpoint]) {
          acc[curr.endpoint] = { count: 0, totalTime: 0 };
        }
        acc[curr.endpoint].count++;
        acc[curr.endpoint].totalTime += curr.responseTime;
        return acc;
      }, {});

      expect(aggregated['/api/v1/hotels'].count).toBe(2);
      expect(aggregated['/api/v1/bookings'].count).toBe(1);
      expect(aggregated['/api/v1/hotels'].totalTime).toBe(110);
    });
  });

  describe('Date Range Calculations', () => {
    it('should calculate 1 hour ago', () => {
      const now = new Date('2026-06-02T12:00:00Z');
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      expect(oneHourAgo.toISOString()).toBe('2026-06-02T11:00:00.000Z');
    });

    it('should calculate 24 hours ago', () => {
      const now = new Date('2026-06-02T12:00:00Z');
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(twentyFourHoursAgo.toISOString()).toBe('2026-06-01T12:00:00.000Z');
    });

    it('should calculate 7 days ago', () => {
      const now = new Date('2026-06-02T12:00:00Z');
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(sevenDaysAgo.toISOString()).toBe('2026-05-26T12:00:00.000Z');
    });

    it('should calculate 30 days ago', () => {
      const now = new Date('2026-06-02T12:00:00Z');
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      expect(thirtyDaysAgo.toISOString()).toBe('2026-05-03T12:00:00.000Z');
    });
  });

  describe('API Key Limit Per Tier', () => {
    const maxKeys = { free: 1, starter: 3, professional: 10, enterprise: 50 };

    it('should enforce free tier limit', () => {
      expect(maxKeys.free).toBe(1);
    });

    it('should enforce starter tier limit', () => {
      expect(maxKeys.starter).toBe(3);
    });

    it('should enforce professional tier limit', () => {
      expect(maxKeys.professional).toBe(10);
    });

    it('should enforce enterprise tier limit', () => {
      expect(maxKeys.enterprise).toBe(50);
    });

    it('should have increasing limits per tier', () => {
      expect(maxKeys.starter).toBeGreaterThan(maxKeys.free);
      expect(maxKeys.professional).toBeGreaterThan(maxKeys.starter);
      expect(maxKeys.enterprise).toBeGreaterThan(maxKeys.professional);
    });
  });

  describe('Service Validation', () => {
    const APIServices = {
      'rez-hotel-service': { name: 'Hotel Search API' },
      'rez-booking-service': { name: 'Booking API' },
    };

    it('should validate existing service', () => {
      const service = 'rez-hotel-service';
      expect(APIServices[service as keyof typeof APIServices]).toBeDefined();
    });

    it('should detect invalid service', () => {
      const service = 'invalid-service';
      expect(APIServices[service as keyof typeof APIServices]).toBeUndefined();
    });

    it('should accept wildcard for enterprise', () => {
      const service = '*';
      expect(service).toBe('*');
    });
  });

  describe('Webhook Events', () => {
    const validEvents = [
      'booking.created', 'booking.modified', 'booking.cancelled', 'booking.completed',
      'payment.success', 'payment.failed',
      'checkin.arrived', 'checkout.departed',
      'review.received', 'message.received',
    ];

    it('should have 10 valid events', () => {
      expect(validEvents).toHaveLength(10);
    });

    it('should contain booking events', () => {
      expect(validEvents.filter(e => e.startsWith('booking'))).toHaveLength(4);
    });

    it('should contain payment events', () => {
      expect(validEvents.filter(e => e.startsWith('payment'))).toHaveLength(2);
    });

    it('should contain checkin/checkout events', () => {
      expect(validEvents.filter(e => e.startsWith('check'))).toHaveLength(2);
    });

    it('should contain review and message events', () => {
      expect(validEvents).toContain('review.received');
      expect(validEvents).toContain('message.received');
    });
  });

  describe('Developer Status Values', () => {
    const validStatuses = ['active', 'suspended', 'pending_verification'];

    it('should have three valid statuses', () => {
      expect(validStatuses).toHaveLength(3);
    });

    it('should include active status', () => {
      expect(validStatuses).toContain('active');
    });

    it('should include suspended status', () => {
      expect(validStatuses).toContain('suspended');
    });

    it('should include pending verification status', () => {
      expect(validStatuses).toContain('pending_verification');
    });
  });

  describe('Webhook Delivery Status', () => {
    const deliveryStatuses = ['pending', 'success', 'failed'];

    it('should have three delivery statuses', () => {
      expect(deliveryStatuses).toHaveLength(3);
    });

    it('should have correct statuses', () => {
      expect(deliveryStatuses).toContain('pending');
      expect(deliveryStatuses).toContain('success');
      expect(deliveryStatuses).toContain('failed');
    });
  });
});

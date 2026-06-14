// Test setup file
jest.setTimeout(10000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = '4806';
process.env.MONGODB_URI = 'mongodb://localhost:27017/user-twin-test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Suppress console logs during tests
if (process.env.SUPPRESS_LOGS !== 'false') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test utilities
export const mockUserId = 'test-user-123';
export const mockTwinId = 'test-twin-456';

export const createMockTwin = () => ({
  userId: mockUserId,
  twinId: mockTwinId,
  profile: {
    demographics: {
      age: 30,
      gender: 'male',
      location: {
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      },
    },
    preferences: {
      language: 'en',
      notifications: ['email', 'push'],
      priceRange: { min: 100, max: 5000 },
    },
  },
  behavioral: {
    interests: [
      { category: 'electronics', score: 0.8 },
      { category: 'fashion', score: 0.6 },
    ],
    purchaseHistory: [
      { category: 'electronics', count: 5, total: 25000 },
      { category: 'fashion', count: 3, total: 5000 },
    ],
    browsingPatterns: {
      patterns: ['product_search', 'price_comparison'],
      frequency: 0.7,
    },
    engagementScore: 0.75,
    lastActive: new Date(),
  },
  predictive: {
    churnRisk: 0.2,
    lifetimeValue: 15000,
    nextPurchaseLikely: new Date(),
    preferredChannels: ['email', 'push'],
    optimalContactTime: '19:00',
  },
  advertising: {
    adResponsiveness: 0.65,
    clickThroughHistory: 0.12,
    conversionRate: 0.08,
    preferredAdFormats: ['banner', 'video'],
    brandAffinities: {
      'Brand A': 0.9,
      'Brand B': 0.7,
      'Brand C': 0.5,
    },
  },
  status: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
});
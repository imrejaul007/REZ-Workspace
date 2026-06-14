// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.example' });

// Mock Redis for tests
jest.mock('../src/services/redis.service', () => ({
  redisService: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isReady: jest.fn().mockReturnValue(true),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    cacheApartment: jest.fn().mockResolvedValue(undefined),
    getCachedApartment: jest.fn().mockResolvedValue(null),
    invalidateApartmentCache: jest.fn().mockResolvedValue(undefined),
    cacheNearbyApartments: jest.fn().mockResolvedValue(undefined),
    getCachedNearbyApartments: jest.fn().mockResolvedValue(null),
  },
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
});
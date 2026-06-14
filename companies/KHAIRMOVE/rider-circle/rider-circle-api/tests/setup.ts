// Jest setup file
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'mongodb://localhost:27017/rider_circle_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NEO4J_URI = 'bolt://localhost:7687';
process.env.NEO4J_USER = 'neo4j';
process.env.NEO4J_PASSWORD = 'test';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token';

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

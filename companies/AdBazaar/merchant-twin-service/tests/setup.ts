/**
 * Test setup for merchant-twin-service
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '4808';
process.env.MONGODB_URI = 'mongodb://localhost:27017/merchant-twin-test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.LOG_LEVEL = 'error';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Increase timeout for MongoDB operations
jest.setTimeout(10000);
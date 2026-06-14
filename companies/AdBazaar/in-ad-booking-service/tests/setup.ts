/**
 * Jest test setup
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/in-ad-booking-test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.RABTUL_WALLET_URL = 'http://localhost:4004';

// Mock logger to reduce noise in tests
jest.mock('../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Global test timeout
jest.setTimeout(10000);
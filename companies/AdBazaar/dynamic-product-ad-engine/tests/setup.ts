/**
 * Test Setup
 * Global test configuration and mocks
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '4841';
process.env.MONGODB_URI = 'mongodb://localhost:27017/dpa_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.IMAGE_CDN_URL = 'https://cdn.adbazaar.com';

// Global test timeout
jest.setTimeout(10000);

// Mock logger to reduce noise during tests
jest.mock('../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Clean up after all tests
afterAll(async () => {
  // Add cleanup logic here if needed
});
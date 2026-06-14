/**
 * ReZ Upsell - Test Setup
 */

import '@jest/globals';

// Mock environment
process.env.NODE_ENV = 'test';
process.env.SHOPIFY_API_KEY = 'test_api_key';
process.env.SHOPIFY_API_SECRET = 'test_api_secret';
process.env.APP_URL = 'http://localhost:4102';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_rez_upsell';

// Mock logger
jest.mock('../src/server/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Global test timeout
jest.setTimeout(30000);

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

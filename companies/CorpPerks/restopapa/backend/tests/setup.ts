import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'file:./test.db';
process.env.RAZORPAY_KEY_ID = 'test_key_id';
process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Clean up after all tests
afterAll(async () => {
  // Close any open connections
  jest.clearAllMocks();
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

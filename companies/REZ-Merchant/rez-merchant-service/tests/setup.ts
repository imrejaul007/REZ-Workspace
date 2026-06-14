/**
 * Test Setup - Environment & Mocks
 *
 * This file is loaded before all tests to set up the environment.
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = '1';

// Mock Redis URL for testing
process.env.REDIS_URL = 'redis://localhost:6379';

// MongoDB test URI
process.env.MONGODB_URI = 'mongodb://localhost:27017/rez-merchant-test';

// Disable external auth service calls
process.env.AUTH_SERVICE_URL = '';

// Generate a test token for testing
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

// Suppress console during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

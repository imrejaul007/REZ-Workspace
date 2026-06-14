/**
 * Jest Test Setup for Order Service
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Set test environment variables
process.env.SERVICE_NAME = 'rez-order-service';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379';
process.env.MONGODB_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/test-order-service';

// Increase test timeout
jest.setTimeout(10000);

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

// Global teardown
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
});

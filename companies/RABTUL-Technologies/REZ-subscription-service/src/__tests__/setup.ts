// Test setup file
// This file is run before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/rez_subscriptions_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.INTERNAL_SERVICE_TOKEN = 'test-token';
process.env.PORT = '4022';

// Increase timeout for tests
jest.setTimeout(10000);

// Suppress console output during tests
if (process.env.SUPPRESS_LOGS !== 'false') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

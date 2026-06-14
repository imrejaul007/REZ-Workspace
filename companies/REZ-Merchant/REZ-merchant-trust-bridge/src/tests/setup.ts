// Jest test setup
jest.setTimeout(10000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-rez-merchant-trust-bridge';
process.env.INTERNAL_SERVICE_TOKEN = 'test-token';
process.env.LOG_LEVEL = 'error';

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global teardown
afterAll(async () => {
  // Clean up any resources
});

// Jest Test Setup

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.PORT = '4601';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

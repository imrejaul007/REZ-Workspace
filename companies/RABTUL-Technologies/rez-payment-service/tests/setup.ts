// Jest setup file for payment service tests
// This file is run before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-payments';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.INTERNAL_SERVICE_TOKENS_JSON = JSON.stringify({ test: 'test-token' });

// Mock external services
jest.mock('../src/config/redis', () => ({
  redis: {
    status: 'ready',
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue(undefined),
  },
  bullmqRedis: {
    status: 'ready',
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
  },
}));

jest.mock('../src/config/mongodb', () => ({
  connectMongoDB: jest.fn().mockResolvedValue(undefined),
  disconnectMongoDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  createServiceLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(() => {
  jest.clearAllMocks();
});

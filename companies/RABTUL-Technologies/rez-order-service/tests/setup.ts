// Jest setup file for order service tests
// This file is run before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.JWT_MERCHANT_SECRET = 'test-merchant-jwt-secret';
process.env.JWT_ADMIN_SECRET = 'test-admin-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-orders';
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
    exists: jest.fn().mockResolvedValue(0),
    getset: jest.fn(),
    pipeline: jest.fn(() => ({
      exec: jest.fn().mockResolvedValue([]),
    })),
    ping: jest.fn().mockResolvedValue('PONG'),
  },
  pub: {
    status: 'ready',
    publish: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue(undefined),
  },
  sub: {
    status: 'ready',
    quit: jest.fn().mockResolvedValue(undefined),
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

// Mock mongoose connection
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connection: {
      readyState: 1,
      collection: jest.fn(() => ({
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' }),
        findOneAndUpdate: jest.fn().mockResolvedValue(null),
        watch: jest.fn().mockReturnValue({
          on: jest.fn(),
          close: jest.fn().mockResolvedValue(undefined),
        }),
      })),
    },
  };
});

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(() => {
  jest.clearAllMocks();
});

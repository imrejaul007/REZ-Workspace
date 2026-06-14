/**
 * Test Setup for Social Content Publisher
 * Configures mocks for MongoDB, Redis, external APIs, and environment
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5083';
process.env.MONGODB_URI = 'mongodb://localhost:27017/social-content-publisher-test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.INSTAGRAM_APP_ID = 'test-app-id';
process.env.INSTAGRAM_APP_SECRET = 'test-app-secret';
process.env.INSTAGRAM_ACCESS_TOKEN = 'test-access-token';
process.env.FACEBOOK_PAGE_ACCESS_TOKEN = 'test-page-token';
process.env.TWITTER_API_KEY = 'test-twitter-key';
process.env.TWITTER_API_SECRET = 'test-twitter-secret';
process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-id';
process.env.LINKEDIN_CLIENT_SECRET = 'test-linkedin-secret';
process.env.LOG_LEVEL = 'error';

// Mock mongoose
jest.mock('mongoose', () => {
  const mockMongoose = {
    connect: jest.fn().mockResolvedValue(undefined),
    connection: {
      readyState: 1,
      db: {
        admin: jest.fn().mockReturnValue({
          ping: jest.fn().mockResolvedValue({ ok: 1 }),
        }),
      },
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    },
    model: jest.fn().mockReturnValue({
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      aggregate: jest.fn(),
    }),
    Schema: jest.fn().mockImplementation(() => ({
      index: jest.fn(),
      virtual: jest.fn(),
      set: jest.fn(),
      methods: {},
      statics: {},
    })),
    Types: {
      ObjectId: {
        toString: jest.fn().mockReturnValue('mock-object-id'),
      },
    },
  };

  return mockMongoose;
});

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    flushdb: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
  }));
});

// Mock winston logger
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  }),
  get: jest.fn(),
  post: jest.fn(),
}));

// Global test timeout
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  jest.clearAllMocks();
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

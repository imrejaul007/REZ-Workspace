/**
 * Test Setup for Instagram Insights Service
 * Configures mocks for MongoDB, external APIs, and environment
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5082';
process.env.MONGODB_URI = 'mongodb://localhost:27017/instagram-insights-test';
process.env.INSTAGRAM_APP_ID = 'test-app-id';
process.env.INSTAGRAM_APP_SECRET = 'test-app-secret';
process.env.INSTAGRAM_ACCESS_TOKEN = 'test-access-token';
process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = 'test-business-account-id';
process.env.CORS_ORIGIN = '*';
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

// Mock winston logger
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock axios for Instagram API calls
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

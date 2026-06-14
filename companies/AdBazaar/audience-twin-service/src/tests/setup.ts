// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock config for tests
jest.mock('../config', () => ({
  default: {
    port: 4805,
    nodeEnv: 'test',
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/audience-twin-test',
      options: {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    jwt: {
      secret: 'test-secret',
      expiresIn: '1h',
    },
    hojaiTwin: {
      url: process.env.HOJAI_TWIN_URL || 'http://localhost:4860',
      apiKey: process.env.HOJAI_TWIN_API_KEY || 'test-api-key',
      timeout: 5000,
    },
    cache: {
      ttl: 60,
    },
    log: {
      level: 'error',
    },
  },
  __esModule: true,
}));

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Set longer timeout for integration tests
jest.setTimeout(30000);
// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock Redis client
jest.mock('../src/config/database', () => {
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    lPush: jest.fn().mockResolvedValue(1),
    lTrim: jest.fn().mockResolvedValue('OK'),
    isOpen: true,
  };

  return {
    connectMongoDB: jest.fn().mockResolvedValue({}),
    disconnectMongoDB: jest.fn().mockResolvedValue(undefined),
    connectRedis: jest.fn().mockResolvedValue(mockRedis),
    disconnectRedis: jest.fn().mockResolvedValue(undefined),
    getRedisClient: jest.fn().mockReturnValue(mockRedis),
    redisClient: mockRedis,
    redisClientWrapper: mockRedis,
  };
});

// Global test timeout
jest.setTimeout(10000);

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
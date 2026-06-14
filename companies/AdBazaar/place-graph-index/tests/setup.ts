// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.example' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock Redis for tests
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),
    mget: jest.fn().mockResolvedValue([]),
    pipeline: jest.fn().mockReturnValue({
      setex: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
  };
  return jest.fn(() => mockRedis);
});

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Give time for any pending operations
  await new Promise((resolve) => setTimeout(resolve, 100));
});
// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock external services
jest.mock('../src/config/database', () => ({
  database: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isHealthy: jest.fn().mockReturnValue(true),
    getConnection: jest.fn()
  }
}));

jest.mock('../src/config/redis', () => ({
  redis: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isHealthy: jest.fn().mockReturnValue(true),
    getClient: jest.fn().mockReturnValue(null),
    setCache: jest.fn().mockResolvedValue(undefined),
    getCache: jest.fn().mockResolvedValue(null),
    deleteCache: jest.fn().mockResolvedValue(undefined),
    setSession: jest.fn().mockResolvedValue(undefined),
    getSession: jest.fn().mockResolvedValue(null),
    deleteSession: jest.fn().mockResolvedValue(undefined),
    checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 100, resetTime: Date.now() + 900000 })
  }
}));

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during tests
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}
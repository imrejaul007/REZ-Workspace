// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/intent-prediction-engine-test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.INTERNAL_SERVICE_KEY = 'test-internal-key';
process.env.DORMANCY_THRESHOLD_DAYS = '7';

// Mock logger to reduce noise in tests
jest.mock('../config/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
  createChildLogger: jest.fn(),
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Allow time for cleanup
  await new Promise((resolve) => setTimeout(resolve, 500));
});

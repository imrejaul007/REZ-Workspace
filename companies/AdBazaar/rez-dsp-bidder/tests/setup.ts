// Test setup file
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.REDIS_URL = 'redis://localhost:6379/test';

// Global test timeout
const TIMEOUT = 10000;

beforeAll(() => {
  // Setup test infrastructure
});

afterAll(() => {
  // Cleanup
});

beforeEach(() => {
  // Reset mocks
});

afterEach(() => {
  // Cleanup after each test
});

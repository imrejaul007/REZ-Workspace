/**
 * Test Setup - Jest Configuration
 */

import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-workspace-test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Mock console for cleaner test output
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console during tests unless in debug mode
  if (!process.env.DEBUG) {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    // Keep console.error for debugging
  }
});

afterAll(() => {
  // Restore console
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(30000);

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
/**
 * Test Setup
 *
 * Setup file for Jest tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '9051';
process.env.LOG_LEVEL = 'error';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  generateTestId: () => `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  generateEmail: () => `test-${Date.now()}@example.com`,
  generatePhone: () => `+1${Date.now().toString().slice(-10)}`,
};

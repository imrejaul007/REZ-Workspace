// Jest setup file
import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/agent_twin_test';
process.env.API_KEY = 'test-api-key';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token';

// Global test timeout
jest.setTimeout(10000);

// Mock console.log to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});
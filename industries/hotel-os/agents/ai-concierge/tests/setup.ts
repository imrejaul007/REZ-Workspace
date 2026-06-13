/**
 * Jest Test Setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.SERVICE_NAME = 'ai-concierge-test';
process.env.SERVICE_VERSION = '1.0.0-test';
process.env.PORT = '0'; // Random port for testing

// Suppress console logs during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

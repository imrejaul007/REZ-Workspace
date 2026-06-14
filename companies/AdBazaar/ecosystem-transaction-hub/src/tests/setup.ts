// Test setup file
// This file is run before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '4811';
process.env.MONGODB_URI = 'mongodb://localhost:27017/ecosystem-transaction-hub-test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.RABTUL_WALLET_URL = 'http://localhost:4004';
process.env.RABTUL_PAYMENT_URL = 'http://localhost:4008';

// Increase timeout for tests
jest.setTimeout(10000);

// Suppress console logs during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
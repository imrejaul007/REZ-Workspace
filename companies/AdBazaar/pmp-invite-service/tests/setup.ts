// Test setup file
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_adbazzaar_pmp';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Increase timeout for tests
jest.setTimeout(10000);

// Suppress console logs during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
// Test setup file
process.env.NODE_ENV = 'test';
process.env.PORT = '4702';
process.env.MONGODB_URI = 'mongodb://localhost:27017/ctv-ad-server-test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key';
process.env.VAST_VERSION = '4.2';

// Mock console.log for cleaner test output
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
// Jest Setup File

beforeAll(() => {
  // Increase timeout for integration tests
  jest.setTimeout(30000);
});

afterAll(() => {
  // Cleanup
});

// Global test configuration
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

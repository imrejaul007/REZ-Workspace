/**
 * Test setup for REZ Scheduler Service
 */

process.env.NODE_ENV = 'test';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-service-token';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

jest.setTimeout(10000);

afterEach(() => {
  jest.clearAllMocks();
});

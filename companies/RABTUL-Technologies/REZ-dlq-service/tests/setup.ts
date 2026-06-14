/**
 * Test setup for REZ DLQ Service
 */

process.env.NODE_ENV = 'test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.LOG_LEVEL = 'error';

jest.setTimeout(10000);

afterEach(() => {
  jest.clearAllMocks();
});

// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock config for tests
jest.mock('../config', () => ({
  default: {
    port: 4031,
    nodeEnv: 'test',
    mongodb: {
      uri: 'mongodb://localhost:27017/rez_mfa_test',
      options: {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    },
    redis: {
      url: 'redis://localhost:6379',
      keyPrefix: 'rez:mfa:test:',
    },
    jwt: {
      secret: 'test-jwt-secret-for-testing-only',
      expiresIn: '1h',
    },
    internalServiceToken: 'test-internal-token',
    sms: {
      provider: 'mock',
      twilio: {
        accountSid: '',
        authToken: '',
        phoneNumber: '',
      },
    },
    rateLimit: {
      windowMs: 900000,
      maxRequests: 100,
    },
    totp: {
      issuer: 'REZ',
      window: 1,
      step: 30,
      algorithm: 'SHA1',
      digits: 6,
    },
    backupCodes: {
      count: 10,
      hashRounds: 10,
      length: 10,
    },
    anomaly: {
      loginWindowHours: 24,
      thresholdSameCity: 5,
      thresholdSameIp: 10,
      thresholdFailedAttempts: 3,
    },
    logging: {
      level: 'error',
      format: 'simple',
    },
  },
}));

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

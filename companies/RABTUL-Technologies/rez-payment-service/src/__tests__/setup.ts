/**
 * Jest Test Setup for Payment Service
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.RAZORPAY_KEY_ID = 'test-key-id';
process.env.RAZORPAY_KEY_SECRET = 'test-key-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.WALLET_SERVICE_URL = 'http://localhost:3005';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token';
process.env.SERVICE_NAME = 'rez-payment-service';

// Increase test timeout
jest.setTimeout(10000);

// Suppress console logs during tests
if (process.env.SUPPRESS_LOGS !== 'false') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global teardown
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
});

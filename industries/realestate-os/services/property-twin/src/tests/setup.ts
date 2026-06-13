// Jest setup file
import mongoose from 'mongoose';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/property-twin-service-test';

// Mock logger to reduce noise in tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Global teardown
afterAll(async () => {
  // Clean up any open connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Increase timeout for database operations
jest.setTimeout(30000);

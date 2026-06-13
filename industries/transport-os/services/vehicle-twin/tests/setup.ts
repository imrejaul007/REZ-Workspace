// Test setup file
import mongoose from 'mongoose';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/vehicle_twin_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.RABBITMQ_URI = 'amqp://localhost:5672';

// Increase timeout for async operations
jest.setTimeout(30000);

// Mock logger to reduce noise during tests
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    http: jest.fn()
  },
  logSecurityEvent: jest.fn(),
  logPerformanceMetric: jest.fn(),
  logTelemetryEvent: jest.fn()
}));

// Mock message broker
jest.mock('../src/utils/message-broker', () => ({
  messageBroker: {
    connect: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockResolvedValue(true),
    publishVehicleEvent: jest.fn().mockResolvedValue(true),
    publishTelemetryEvent: jest.fn().mockResolvedValue(true),
    isConnected: jest.fn().mockReturnValue(true),
    close: jest.fn().mockResolvedValue(undefined)
  }
}));

// Global teardown
afterAll(async () => {
  // Clean up mongoose connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

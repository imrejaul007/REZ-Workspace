import mongoose from 'mongoose';
import { DriverTwinModel } from '../src/models/index.js';

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/driver_twin_test';

// Increase test timeout
jest.setTimeout(10000);

// Connect to test database before all tests
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!, {
      serverSelectionTimeoutMS: 2000,
    });
  } catch (error) {
    console.warn('MongoDB connection failed, schema tests will run without DB:', error);
  }
}, 5000);

// Clean up after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      await DriverTwinModel.deleteMany({});
    } catch (error) {
      // Ignore cleanup errors
    }
  }
});

// Disconnect after all tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.disconnect();
    } catch (error) {
      // Ignore disconnect errors
    }
  }
});

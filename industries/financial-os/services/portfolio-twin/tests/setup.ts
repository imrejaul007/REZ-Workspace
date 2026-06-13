import mongoose from 'mongoose';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/portfolio_twin_test';
process.env.API_KEY = 'test-api-key';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token';

// Global test setup
beforeAll(async () => {
  // Connect to test database
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
  } catch (error) {
    console.warn('MongoDB not available, tests will use mocks');
  }
});

// Global test teardown
afterAll(async () => {
  // Clean up database
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

// Clear all collections after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
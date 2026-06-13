import mongoose from 'mongoose';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/guest_twin_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.API_KEY = 'test-api-key';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token';

// Increase timeout for async operations
jest.setTimeout(30000);

// Clean up before all tests
beforeAll(async () => {
  // Connect to test database
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
  } catch (error) {
    console.warn('MongoDB connection failed, some tests may be skipped');
  }
});

// Clean up after all tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    // Drop test database
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

// Clean up before each test
beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
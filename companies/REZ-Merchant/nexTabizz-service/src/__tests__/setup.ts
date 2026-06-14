import mongoose from 'mongoose';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'test-secret-key';

// Increase timeout for MongoDB operations
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

const mongoose = require('mongoose');

beforeAll(async () => {
  const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/learniq_test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
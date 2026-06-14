import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks_exit';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Exit service uses dynamic data, no static seed needed
    // Templates and instances are created via API

    console.log('Exit Service is ready');
    console.log('Use the API to create exit interviews and offboarding instances');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();

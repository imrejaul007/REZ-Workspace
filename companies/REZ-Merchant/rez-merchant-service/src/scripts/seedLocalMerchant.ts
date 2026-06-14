import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import { Merchant } from '../models/Merchant';
import { Store } from '../models/Store';

const EMAIL = process.env.SEED_MERCHANT_EMAIL || 'merchant@rez.app';
const _PASSWORD_RAW = process.env.SEED_MERCHANT_PASSWORD;
if (!_PASSWORD_RAW) throw new Error('[seedLocalMerchant] FATAL: SEED_MERCHANT_PASSWORD env var is required');
const PASSWORD: string = _PASSWORD_RAW;

async function run() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(mongoUri);

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const merchant = await Merchant.findOneAndUpdate(
    { email: EMAIL },
    {
      $set: {
        businessName: 'Rez Test Merchant',
        ownerName: 'Rez Merchant',
        email: EMAIL,
        password: passwordHash,
        phone: '9999999999',
        businessAddress: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '123456',
          country: 'India',
        },
        verificationStatus: 'verified',
        isActive: true,
        emailVerified: true,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: null,
        lastLoginIP: null,
        refreshTokenHash: null,
        refreshTokenMeta: null,
      },
      $setOnInsert: {
        onboarding: {
          status: 'completed',
          currentStep: 4,
          completedSteps: [1, 2, 3, 4],
          stepData: {},
        },
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  await Store.findOneAndUpdate(
    { merchant: merchant._id, name: 'Rez Test Merchant Main Store' },
    {
      $set: {
        merchant: merchant._id,
        merchantId: merchant._id,
        name: 'Rez Test Merchant Main Store',
        category: 'general',
        location: {
          address: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
        },
        contact: {
          phone: '9999999999',
          email: EMAIL,
        },
        isActive: true,
        isListed: true,
        isVerified: true,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  logger.debug(`Seeded merchant login for ${EMAIL}`);
  // Password is never logged — only the env var controls the credential
}

run()
  .catch((error) => {
    logger.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

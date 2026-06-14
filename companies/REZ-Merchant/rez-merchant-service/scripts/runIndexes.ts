/**
 * Run Database Indexes
 *
 * Usage:
 *   npm run db:indexes        # Create all indexes
 *   npm run db:indexes:list   # List all indexes
 *   npm run db:indexes:drop   # Drop B2B indexes
 *   npm run db:indexes:analyze # Analyze collections
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { createB2BIndexes, dropB2BIndexes, listIndexes, analyzeCollection } from '../src/config/databaseIndexes';
import { logger } from '../src/config/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-merchant';

const command = process.argv[2] || 'create';

async function main() {
  logger.info(`[Index Script] Connecting to MongoDB: ${MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[Index Script] Connected');

    switch (command) {
      case 'create':
        logger.info('[Index Script] Creating B2B indexes...');
        await createB2BIndexes();
        break;

      case 'drop':
        logger.info('[Index Script] Dropping B2B indexes...');
        await dropB2BIndexes();
        break;

      case 'list':
        logger.info('[Index Script] Listing indexes for B2B collections...');
        await listIndexes('suppliers');
        await listIndexes('purchaseorders');
        await listIndexes('supplierledgers');
        await listIndexes('creditlines');
        break;

      case 'analyze':
        logger.info('[Index Script] Analyzing B2B collections...');
        await analyzeCollection('suppliers');
        await analyzeCollection('purchaseorders');
        await analyzeCollection('supplierledgers');
        break;

      default:
        logger.info(`[Index Script] Unknown command: ${command}`);
        logger.info('Usage: npm run db:indexes [-- create|drop|list|analyze]');
    }

    logger.info('[Index Script] Done');
  } catch (err) {
    logger.error('[Index Script] Error', { error: err });
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();

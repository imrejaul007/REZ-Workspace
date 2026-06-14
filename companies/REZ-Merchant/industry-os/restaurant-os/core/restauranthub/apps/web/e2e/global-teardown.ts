import logger from './utils/logger';

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  logger.info('🧹 Starting global teardown...');

  try {
    // Cleanup operations go here
    // For example: delete test data, cleanup databases, etc.

    logger.info('✅ Global teardown completed');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here as it would fail the test suite
  }
}

export default globalTeardown;
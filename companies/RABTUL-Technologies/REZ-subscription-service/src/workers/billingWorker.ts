/**
 * Billing Worker
 *
 * Standalone worker process for running billing operations.
 * Can be run separately from the main application for scaling.
 *
 * Usage:
 *   npm run worker:billing
 */

import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../utils/database';
import { billingEngine } from '../services/billingEngine';
import { logger } from '../utils/logger';

async function main(): Promise<void> {
  try {
    logger.info('Starting billing worker...');

    // Connect to database
    await connectDatabase();
    logger.info('Connected to database');

    // Run billing cycle
    logger.info('Running billing cycle...');
    const results = await billingEngine.runBillingCycle();

    logger.info('Billing cycle completed', {
      totalProcessed: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length
    });

    // Calculate metrics
    const metrics = await billingEngine.calculateBillingMetrics();
    logger.info('Billing metrics', metrics);

    // Exit successfully
    process.exit(0);
  } catch (error) {
    logger.error('Billing worker failed', { error });
    process.exit(1);
  }
}

main();

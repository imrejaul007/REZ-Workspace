/**
 * Dunning Worker
 *
 * Standalone worker process for running dunning operations.
 * Handles payment retries and subscription status updates.
 *
 * Usage:
 *   npm run worker:dunning
 */

import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../utils/database';
import { billingEngine } from '../services/billingEngine';
import { paymentCollector } from '../services/paymentCollector';
import { logger } from '../utils/logger';

async function main(): Promise<void> {
  try {
    logger.info('Starting dunning worker...');

    // Connect to database
    await connectDatabase();
    logger.info('Connected to database');

    // Run dunning cycle
    logger.info('Running dunning cycle...');
    const results = await billingEngine.runDunningCycle();

    logger.info('Dunning cycle completed', {
      totalProcessed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      byAction: results.reduce((acc, r) => {
        acc[r.action] = (acc[r.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    // Process payment retries
    const pastDueSubscriptions = results.filter(r => r.action === 'retry_scheduled');
    logger.info('Processing payment retries', { count: pastDueSubscriptions.length });

    for (const result of pastDueSubscriptions) {
      try {
        const paymentResult = await paymentCollector.retryPayment(result.subscriptionId);
        logger.info('Payment retry completed', {
          subscriptionId: result.subscriptionId,
          success: paymentResult.success,
          error: paymentResult.error
        });
      } catch (error) {
        logger.error('Payment retry failed', {
          subscriptionId: result.subscriptionId,
          error
        });
      }
    }

    // Exit successfully
    process.exit(0);
  } catch (error) {
    logger.error('Dunning worker failed', { error });
    process.exit(1);
  }
}

main();

import cron from 'node-cron';
import { runReconciliation, recoverStuckPayments } from '../services/reconciliationService';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('cron');

export function startReconciliationJobs(): void {
  // Every 15 minutes: reconcile stuck processing payments
  cron.schedule('*/15 * * * *', async () => {
    try {
      await runReconciliation();
    } catch (err) {
      logger.error('Reconciliation cron failed', { error: err.message });
    }
  });

  // Every 5 minutes: expire stuck pending payments
  cron.schedule('*/5 * * * *', async () => {
    try {
      await recoverStuckPayments();
    } catch (err) {
      logger.error('Recovery cron failed', { error: err.message });
    }
  });

  logger.info('Reconciliation cron jobs scheduled');
}

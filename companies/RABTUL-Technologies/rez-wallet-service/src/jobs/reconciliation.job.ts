import mongoose from 'mongoose';
import { getAccountBalance, findBalanceMismatches, findOrphanedEntries } from '../services/ledgerService';
import { logger } from '../config/logger';

// Run daily at 2 AM
export async function runDailyReconciliation(): Promise<void> {
  logger.info('[RECONCILIATION] Starting daily reconciliation...');
  
  const startTime = Date.now();
  
  try {
    // 1. Find orphaned entries (missing pairs)
    const orphans = await findOrphanedEntries();
    if (orphans.length > 0) {
      logger.error(`[RECONCILIATION] WARNING: ${orphans.length} orphaned entries found`);
      await sendAlert('orphan_entries', orphans);
    }
    
    // 2. Find balance mismatches
    const mismatches = await findBalanceMismatches();
    if (mismatches.length > 0) {
      logger.error(`[RECONCILIATION] WARNING: ${mismatches.length} balance mismatches`);
      await sendAlert('balance_mismatch', mismatches);
    }
    
    // 3. Generate report
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      orphans: orphans.length,
      mismatches: mismatches.length,
      status: orphans.length === 0 && mismatches.length === 0 ? 'PASSED' : 'FAILED'
    };
    
    logger.info('[RECONCILIATION] Complete', report);
    
    // Store report
    await ReconciliationReport.create({
      ...report,
      details: { orphans, mismatches }
    });
    
  } catch (error) {
    logger.error('[RECONCILIATION] Error', { error: error instanceof Error ? error.message : String(error) });
    await sendAlert('reconciliation_failed', { error: error.message });
  }
}

async function sendAlert(type: string, data: unknown): Promise<void> {
  logger.warn(`[ALERT] ${type}`, data);

  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  const pagerdutyKey = process.env.PAGERDUTY_ROUTING_KEY;

  const alertPayload = {
    type,
    timestamp: new Date().toISOString(),
    data,
  };

  // Send to Slack if configured
  if (slackWebhook) {
    try {
      const slackBody = {
        text: `*[RECONCILIATION ALERT]*`,
        attachments: [{
          color: type === 'reconciliation_failed' ? 'danger' : 'warning',
          fields: [
            { title: 'Alert Type', value: type, short: true },
            { title: 'Time', value: alertPayload.timestamp, short: true },
            { title: 'Details', value: JSON.stringify(data, null, 2) },
          ],
        }],
      };
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackBody),
      });
      logger.info('[ALERT] Slack notification sent');
    } catch (error) {
      logger.error('[ALERT] Failed to send Slack notification', error);
    }
  }

  // Send to PagerDuty for critical alerts
  if (pagerdutyKey && (type === 'reconciliation_failed' || type === 'orphan_spike')) {
    try {
      await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routing_key: pagerdutyKey,
          event_action: 'trigger',
          dedup_key: `reconciliation-${type}-${Date.now()}`,
          payload: {
            summary: `Reconciliation ${type}: ${type === 'reconciliation_failed' ? 'Job failed' : 'Orphan spike detected'}`,
            severity: type === 'reconciliation_failed' ? 'critical' : 'warning',
            source: 'rez-wallet-service',
            custom_details: alertPayload,
          },
        }),
      });
      logger.info('[ALERT] PagerDuty notification sent');
    } catch (error) {
      logger.error('[ALERT] Failed to send PagerDuty notification', error);
    }
  }
}

// Run every hour for critical checks
setInterval(async () => {
  const orphans = await findOrphanedEntries();
  if (orphans.length > 10) {
    await sendAlert('orphan_spike', { count: orphans.length });
  }
}, 60 * 60 * 1000);

// Run daily at 2 AM
const DAILY_MS = 24 * 60 * 60 * 1000;
const TWO_AM = 2 * 60 * 60 * 1000;
const now = Date.now();
const twoAM = new Date();
twoAM.setHours(2, 0, 0, 0);
if (twoAM.getTime() < now) twoAM.setDate(twoAM.getDate() + 1);
const msUntilTwoAM = twoAM.getTime() - now;

setTimeout(() => {
  runDailyReconciliation();
  setInterval(runDailyReconciliation, DAILY_MS);
}, msUntilTwoAM);

export default runDailyReconciliation;

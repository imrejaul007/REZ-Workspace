import { Router, Request, Response } from 'express';
import { requireInternalToken } from '../middleware/internalAuth';
import { ledgerReconciliationService } from '../services/ledgerReconciliation';
import { logger } from '../config/logger';

const router = Router();

// All reconciliation routes require internal service token
router.use(requireInternalToken);

/**
 * GET /internal/reconciliation/report
 * Generate a full reconciliation report (orphaned entries + balance mismatches)
 * This is an expensive operation that scans the entire ledger collection
 * Should only be run by administrative processes or during maintenance windows
 */
router.get('/report', async (_req: Request, res: Response) => {
  try {
    logger.info('[Reconciliation] Starting full report generation');
    const report = await ledgerReconciliationService.generateReconciliationReport();

    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    logger.error('[Reconciliation] Error generating report', {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate reconciliation report',
    });
  }
});

/**
 * GET /internal/reconciliation/orphans
 * List all orphaned ledger entries (unpaired debits/credits)
 * Lighter weight than full report — only checks pair integrity
 */
router.get('/orphans', async (_req: Request, res: Response) => {
  try {
    logger.info('[Reconciliation] Listing orphaned entries');
    const orphanReport = await ledgerReconciliationService.findOrphanedEntries();

    res.json({
      success: true,
      data: orphanReport,
    });
  } catch (err) {
    logger.error('[Reconciliation] Error listing orphans', {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to list orphaned entries',
    });
  }
});

/**
 * GET /internal/reconciliation/balance-check/:userId
 * Check balance consistency for a specific user
 * Compares wallet.balance.total against ledger sum
 */
router.get('/balance-check/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'userId parameter is required',
      });
      return;
    }

    logger.info('[Reconciliation] Checking balance for user', { userId });
    const mismatch = await ledgerReconciliationService.checkUserBalance(userId as string);

    res.json({
      success: true,
      data: {
        userId,
        hasIssue: mismatch !== null,
        mismatch: mismatch || null,
      },
    });
  } catch (err) {
    logger.error('[Reconciliation] Error checking user balance', {
      userId: req.params.userId,
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to check user balance',
    });
  }
});

/**
 * GET /internal/reconciliation/balance-mismatches
 * List all users with balance mismatches
 * Can be optionally filtered to a single user via ?userId=
 */
router.get('/balance-mismatches', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;

    logger.info('[Reconciliation] Checking balance mismatches', { userId });
    const report = await ledgerReconciliationService.findBalanceMismatches(userId);

    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    logger.error('[Reconciliation] Error checking balance mismatches', {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to check balance mismatches',
    });
  }
});

export default router;

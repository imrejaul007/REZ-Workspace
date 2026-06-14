/**
 * Reconciliation Routes
 *
 * Manual and automated reconciliation
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import {
  runFullReconciliation,
  reconcileEntry,
  manualReconcile,
  disputeRecord,
  resolveDispute,
  getReconciliationSummary,
} from '../services/reconciliationService';
import { merchantAuth } from '../middleware/auth';
import { errorResponse, errors } from '../utils/response';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * POST /reconciliation/run
 * Run full reconciliation
 */
router.post('/run', async (req: Request, res: Response) => {
  try {
    const result = await runFullReconciliation(req.merchantId);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('[Reconciliation] Run failed', { error: err });
    errorResponse(res, errors.internal('Reconciliation failed'));
  }
});

/**
 * GET /reconciliation/summary
 * Get reconciliation summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const summary = await getReconciliationSummary(req.merchantId);
    res.json({ success: true, data: summary });
  } catch (err) {
    logger.error('[Reconciliation] Summary failed', { error: err });
    errorResponse(res, errors.internal('Failed to get summary'));
  }
});

/**
 * POST /reconciliation/manual
 * Manually reconcile two records
 */
router.post('/manual', async (req: Request, res: Response) => {
  try {
    const { sourceType, sourceId, targetType, targetId, notes } = req.body;

    if (!sourceType || !sourceId || !targetType || !targetId) {
      errorResponse(res, errors.badRequest('Missing required fields'));
      return;
    }

    const result = await manualReconcile(
      req.merchantId,
      sourceType,
      sourceId,
      targetType,
      targetId,
      notes
    );

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, message: result.message });
  } catch (err) {
    logger.error('[Reconciliation] Manual failed', { error: err });
    errorResponse(res, errors.internal('Manual reconciliation failed'));
  }
});

/**
 * POST /reconciliation/dispute
 * Mark record as disputed
 */
router.post('/dispute', async (req: Request, res: Response) => {
  try {
    const { recordType, recordId, reason } = req.body;

    if (!recordType || !recordId || !reason) {
      errorResponse(res, errors.badRequest('Missing required fields'));
      return;
    }

    const result = await disputeRecord(req.merchantId, recordType, recordId, reason);

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, message: result.message });
  } catch (err) {
    logger.error('[Reconciliation] Dispute failed', { error: err });
    errorResponse(res, errors.internal('Dispute marking failed'));
  }
});

/**
 * POST /reconciliation/resolve
 * Resolve a disputed record
 */
router.post('/resolve', async (req: Request, res: Response) => {
  try {
    const { recordType, recordId, resolution, notes } = req.body;

    if (!recordType || !recordId || !resolution) {
      errorResponse(res, errors.badRequest('Missing required fields'));
      return;
    }

    const result = await resolveDispute(req.merchantId, recordType, recordId, resolution, notes || '');

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, message: result.message });
  } catch (err) {
    logger.error('[Reconciliation] Resolve failed', { error: err });
    errorResponse(res, errors.internal('Dispute resolution failed'));
  }
});

export default router;

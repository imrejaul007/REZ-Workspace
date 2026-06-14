import { Router, Request, Response } from 'express';
import { requireInternalToken } from '../middleware/internalAuth';
import { CreditScoreService } from '../services/creditScore.service';
import { logger } from '../config/logger';

const router = Router();

// POST /internal/credit/apply - Create BNPL transaction (internal)
router.post('/credit/apply', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { userId, phone, merchantId, merchantName, vertical, amount } = req.body;

    if (!userId || !phone || !merchantId || !vertical || !amount) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const transaction = await CreditScoreService.createBNPL({
      userId,
      phone,
      merchantId,
      merchantName: merchantName || 'Unknown',
      vertical,
      amount: parseFloat(amount),
    });

    res.json({ success: true, data: transaction });
  } catch (err) {
    logger.error('[InternalCredit] BNPL creation failed', { error: err.message });
    res.status(400).json({ success: false, message: 'Internal server error' });
  }
});

// POST /internal/credit/repay - Repay BNPL (internal)
router.post('/credit/repay', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { userId, transactionId, amount } = req.body;

    if (!userId || !transactionId || !amount) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const transaction = await CreditScoreService.repayBNPL(
      userId,
      transactionId,
      parseFloat(amount)
    );

    res.json({ success: true, data: transaction });
  } catch (err) {
    logger.error('[InternalCredit] Repay failed', { error: err.message });
    res.status(400).json({ success: false, message: 'Internal server error' });
  }
});

// POST /internal/credit/check-eligibility - Check eligibility (internal)
router.post('/credit/check-eligibility', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { userId, phone, amount } = req.body;

    if (!userId || !phone || !amount) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const eligibility = await CreditScoreService.checkEligibility(
      userId,
      phone,
      parseFloat(amount)
    );

    res.json({ success: true, data: eligibility });
  } catch (err) {
    logger.error('[InternalCredit] Eligibility check failed', { error: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /internal/credit/summary - Get credit summary (internal)
router.post('/credit/summary', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { userId, phone } = req.body;

    if (!userId || !phone) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const summary = await CreditScoreService.getCreditSummary(userId, phone);
    res.json({ success: true, data: summary });
  } catch (err) {
    logger.error('[InternalCredit] Get summary failed', { error: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /internal/credit/bnpl/:userId - Get active BNPLs (internal)
router.get('/credit/bnpl/:userId', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const userId = String(req.params['userId'] || '');
    const bnpls = await CreditScoreService.getActiveBNPLs(userId);
    res.json({ success: true, data: bnpls });
  } catch (err) {
    logger.error('[InternalCredit] Get BNPLs failed', { error: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /internal/credit/refresh - Batch refresh credit scores (for scheduler)
router.post('/credit/refresh', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { batchSize = 1000 } = req.body;
    const CreditScore = (await import('../models/CreditScore')).CreditScore;

    const cursor = CreditScore.find({ isActive: true }).limit(batchSize).cursor();
    let count = 0;

    for await (const score of cursor) {
      try {
        await CreditScoreService.calculateScore(score.userId, score.phone);
        count++;
      } catch (err) {
        logger.warn('[InternalCredit] Failed to refresh score', { userId: score.userId, error: err.message });
      }
    }

    res.json({ success: true, data: { count } });
  } catch (err) {
    logger.error('[InternalCredit] Batch refresh failed', { error: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /internal/credit/process-overdue - Process overdue BNPLs
router.post('/credit/process-overdue', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const processed = await CreditScoreService.processOverdueBNPLs();
    logger.info('[InternalCredit] Processed overdue BNPLs', { count: processed });
    res.json({ success: true, data: { count: processed } });
  } catch (err) {
    logger.error('[InternalCredit] Process overdue failed', { error: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /internal/credit/recalculate - Recalculate single user score
router.post('/credit/recalculate', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { userId, phone, onTimePayments, latePayments, walletBalanceAvg, transactionCount, daysActive } = req.body;

    if (!userId || !phone) {
      res.status(400).json({ success: false, message: 'userId and phone required' });
      return;
    }

    const score = await CreditScoreService.calculateScore(userId, phone, {
      onTimePayments,
      latePayments,
      walletBalanceAvg,
      transactionCount,
      daysActive,
    });

    res.json({ success: true, data: score });
  } catch (err) {
    logger.error('[InternalCredit] Recalculate failed', { error: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

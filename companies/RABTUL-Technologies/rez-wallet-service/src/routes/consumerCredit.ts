import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { CreditScoreService } from '../services/creditScore.service';

const router = Router();

// GET /api/credit/score - Get user's credit score summary
router.get('/score', requireAuth, async (req: Request, res: Response) => {
  try {
    const summary = await CreditScoreService.getCreditSummary(req.userId!, req.userPhone!);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/credit/bnpl - Get active BNPL transactions
router.get('/bnpl', requireAuth, async (req: Request, res: Response) => {
  try {
    const bnpls = await CreditScoreService.getActiveBNPLs(req.userId!);
    res.json({ success: true, data: bnpls });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/credit/apply - Apply for BNPL
router.post('/apply', requireAuth, async (req: Request, res: Response) => {
  try {
    const { merchantId, merchantName, vertical, amount } = req.body;

    if (!merchantId || !vertical || !amount) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const transaction = await CreditScoreService.createBNPL({
      userId: req.userId!,
      phone: req.userPhone!,
      merchantId,
      merchantName: merchantName || 'Unknown',
      vertical,
      amount: parseFloat(amount),
    });

    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/credit/repay - Repay BNPL
router.post('/repay', requireAuth, async (req: Request, res: Response) => {
  try {
    const { transactionId, amount } = req.body;

    if (!transactionId || !amount) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const transaction = await CreditScoreService.repayBNPL(
      req.userId!,
      transactionId,
      parseFloat(amount)
    );

    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/credit/check-eligibility - Check BNPL eligibility
router.post('/check-eligibility', requireAuth, async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      res.status(400).json({ success: false, message: 'Amount is required' });
      return;
    }

    const eligibility = await CreditScoreService.checkEligibility(
      req.userId!,
      req.userPhone!,
      parseFloat(amount)
    );

    res.json({ success: true, data: eligibility });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/credit/recalculate - Recalculate credit score
router.post('/recalculate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { onTimePayments, latePayments, walletBalanceAvg, transactionCount, daysActive } = req.body;

    const score = await CreditScoreService.calculateScore(req.userId!, req.userPhone!, {
      onTimePayments,
      latePayments,
      walletBalanceAvg,
      transactionCount,
      daysActive,
    });

    res.json({ success: true, data: score });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { PayoutService } from '../services/payout.service';

const router = Router();
const payoutService = new PayoutService(
  null as any,
  { get: (key: string, defaultValue?: string) => process.env[key] || defaultValue } as any
);

/**
 * @route GET /api/payouts/summary/:driverId
 * @desc Get driver's payout summary
 */
router.get('/summary/:driverId', async (req: Request, res: Response) => {
  try {
    const summary = await payoutService.getDriverPayoutSummary(req.params.driverId);
    res.json({ success: true, summary });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/payouts/request
 * @desc Request a payout
 */
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { driverId, amount, method } = req.body;

    const result = await payoutService.requestPayout({
      driverId,
      amount,
      method,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/payouts/status/:payoutId
 * @desc Get payout status
 */
router.get('/status/:payoutId', async (req: Request, res: Response) => {
  try {
    const status = await payoutService.getPayoutStatus(req.params.payoutId);
    res.json({ success: true, status });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/payouts/history/:driverId
 * @desc Get driver's payout history
 */
router.get('/history/:driverId', async (req: Request, res: Response) => {
  try {
    const history = await payoutService.getDriverPayoutHistory(req.params.driverId);
    res.json({ success: true, history });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/payouts/pending
 * @desc Get all pending payouts (admin)
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const pending = await payoutService.getPendingPayouts();
    res.json({ success: true, ...pending });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/payouts/auto
 * @desc Trigger auto-payouts (admin/cron)
 */
router.post('/auto', async (req: Request, res: Response) => {
  try {
    const result = await payoutService.processAutoPayouts();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

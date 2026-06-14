import { Router, Request, Response } from 'express';
import { VoucherService } from '../services/voucher.service';
import { WalletService } from '../services/wallet.service';

const router = Router();

/**
 * @route GET /api/vouchers/user/:userId
 * @desc Get user's vouchers
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const voucherService = req.app.get('voucherService');
    const vouchers = await voucherService.getUserVouchers(req.params.userId);
    res.json({ success: true, vouchers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/vouchers/user/:userId/eligible
 * @desc Get eligible vouchers for a ride
 */
router.get('/user/:userId/eligible', async (req: Request, res: Response) => {
  try {
    const voucherService = req.app.get('voucherService');
    const { rideType = 'cab', amount = '0' } = req.query;

    const vouchers = await voucherService.getUserVouchers(
      req.params.userId,
      undefined
    );

    // Filter by ride type and amount
    const eligible = vouchers.filter((v: { rideTypes?: string[]; minOrderValue?: number }) => {
      if (!v.rideTypes?.includes(rideType as string)) return false;
      if (v.minOrderValue && parseFloat(amount as string) < v.minOrderValue) return false;
      return true;
    });

    res.json({ success: true, vouchers: eligible });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/vouchers/apply
 * @desc Apply voucher to ride
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const voucherService = req.app.get('voucherService');
    const { userId, voucherId, rideAmount, rideType = 'cab' } = req.body;

    const result = await voucherService.applyVoucher(
      userId,
      voucherId,
      parseFloat(rideAmount) || 0,
      rideType
    );

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/vouchers/:voucherId/redeem
 * @desc Redeem voucher for a ride
 */
router.post('/:voucherId/redeem', async (req: Request, res: Response) => {
  try {
    const voucherService = req.app.get('voucherService');
    const { rideId } = req.body;

    const success = await voucherService.redeemVoucher(req.params.voucherId, rideId);
    res.json({ success });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/vouchers/user/:userId/wallet
 * @desc Get user's voucher balance
 */
router.get('/user/:userId/wallet', async (req: Request, res: Response) => {
  try {
    const walletService = req.app.get('walletService');
    const balance = await walletService.getBalance(req.params.userId);
    res.json({ success: true, ...balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

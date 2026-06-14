
import { Router, Request, Response } from 'express';
import { Payout } from '../models/Payout';
import { SettlementService } from '../services/settlementService';
import { merchantAuth, requireVerifiedMerchant } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);
// HIGH FIX: Gate payout endpoints to verified merchants only
router.use(requireVerifiedMerchant);

router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.status) query.status = req.query.status;

    // BE-MER-033 FIX: Validate pagination parameters
    const pageParsed = parseInt(req.query.page as string, 10);
    const limitParsed = parseInt(req.query.limit as string, 10);
    const page = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : 1;
    const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(100, limitParsed) : 20;

    const [items, total] = await Promise.all([
      Payout.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Payout.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/settlement-preview', async (req: Request, res: Response) => {
  try {
    // Get current month's settlement calculation
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const calculation = await SettlementService.calculateSettlement(
      req.merchantId as unknown,
      startDate,
      endDate,
    );

    res.json({ success: true, data: calculation });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Payout.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

/**
 * DEPRECATED — DUAL PAYOUT FIX (2026-04-16):
 *
 * This route is DEPRECATED. The canonical withdrawal path is now:
 *   POST /api/merchant/wallet/withdraw  (walletMerchant.ts)
 *
 * This file is kept for read-only access (GET payouts, settlement history) which
 * remain valid. The POST / endpoint below now returns 410 Gone with a redirect
 * instruction so existing clients migrate to the wallet endpoint.
 *
 * WHY: Two parallel paths existed (payouts.ts and walletMerchant.ts) with no
 * mutual exclusion. Path A validated against settlements but never debited the wallet.
 * Path B debited the wallet but never validated against settlements. A merchant
 * could drain the wallet via Path B then still request payouts via Path A beyond
 * available balance. The fix consolidates to walletMerchant.ts as the single path.
 */
router.post('/', async (req: Request, res: Response) => {
  // DUAL-PAYOUT-FIX-07: Return 410 Gone — this path is deprecated.
  // All withdrawal requests must go through POST /api/merchant/wallet/withdraw
  res.status(410).json({
    success: false,
    deprecationNotice: 'This endpoint is deprecated. Please use POST /api/merchant/wallet/withdraw for withdrawals.',
    migration: {
      endpoint: '/api/merchant/wallet/withdraw',
      body: { amount: req.body.amount },
      description: 'POST to /api/merchant/wallet/withdraw with { amount } to request a withdrawal.',
    },
  });
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    // Only allow updating notes — status/amount changes are admin-only via wallet service
    const { notes } = req.body;
    const item = await Payout.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId, status: 'pending' },
      { $set: { notes: notes || null } },
      { new: true },
    );
    if (!item) { res.status(404).json({ success: false, message: 'Not found or not editable' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // MS-08: Only allow deleting pending payouts — processing/completed payouts must not be hard-deleted
    const item = await Payout.findOne({ _id: req.params.id, merchantId: req.merchantId, status: 'pending' }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found or payout cannot be deleted (only pending payouts can be deleted)' }); return; }

    // DUAL-PAYOUT-FIX-08: Block deletion of payouts created by the canonical wallet path.
    // These payouts are linked to wallet debits. Deleting them without reversing the
    // wallet debit would permanently remove funds from the merchant's wallet.
    // Use the cancellation flow in walletMerchant.ts to properly reverse the debit.
    if ((item as unknown).notes && String((item as unknown).notes).startsWith('wallet_withdrawal:')) {
      res.status(409).json({
        success: false,
        message: 'Cannot delete payout created via wallet withdrawal. Use the wallet cancellation endpoint to reverse the debit.',
        payoutId: (item as unknown)._id,
      });
      return;
    }

    // Legacy payouts (pre-fix) were not linked to wallet debits — safe to delete
    await Payout.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/settlements/history', async (req: Request, res: Response) => {
  try {
    // BE-MER-033 FIX: Validate pagination parameters
    const pageParsed = parseInt(req.query.page as string, 10);
    const limitParsed = parseInt(req.query.limit as string, 10);
    const page = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : 1;
    const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(100, limitParsed) : 20;

    const { settlements, total } = await SettlementService.getSettlementHistory(
      req.merchantId as unknown,
      limit,
      (page - 1) * limit,
    );

    res.json({
      success: true,
      data: {
        items: settlements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;

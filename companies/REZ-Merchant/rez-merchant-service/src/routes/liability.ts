
import { Router, Request, Response } from 'express';
import { MerchantLiability } from '../models/MerchantLiability';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// GET /liability/summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const mid = new mongoose.Types.ObjectId(req.merchantId);

    const [totals, byCycle] = await Promise.all([
      MerchantLiability.aggregate([
        { $match: { merchant: mid } },
        { $group: {
          _id: null,
          totalIssued: { $sum: '$rewardIssued' },
          totalRedeemed: { $sum: '$rewardRedeemed' },
          totalPending: { $sum: '$pendingAmount' },
          totalSettled: { $sum: '$settledAmount' },
          activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending_settlement'] }, 1, 0] } },
          settledCount: { $sum: { $cond: [{ $eq: ['$status', 'settled'] }, 1, 0] } },
        }},
      ]),
      MerchantLiability.aggregate([
        { $match: { merchant: mid } },
        { $group: { _id: '$cycleId', totalSettled: { $sum: '$settledAmount' }, totalPending: { $sum: '$pendingAmount' }, status: { $first: '$status' }, lastSettlementDate: { $max: '$settlementDate' } } },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
    ]);

    const summary = totals[0] || { totalIssued: 0, totalRedeemed: 0, totalPending: 0, totalSettled: 0, activeCount: 0, pendingCount: 0, settledCount: 0 };
    const fee = summary.totalSettled * 0.15;
    // BAK-LOW-002 fix: compute totalGST first, then split so cgst+sgst === totalGst.
    // Rounding cgst and sgst independently can make cgst+sgst != totalGST due to banker's rounding.
    const totalGst = +((fee * 0.18)).toFixed(2);
    const cgst = +(totalGst / 2).toFixed(2);
    const sgst = +(totalGst - cgst).toFixed(2);  // ensures cgst + sgst === totalGst

    res.json({
      success: true,
      data: {
        ...summary,
        totalTax: totalGst,
        gst: {
          platformFee: +fee.toFixed(2),
          cgst,
          sgst,
          totalGst,
        },
        recentCycles: byCycle,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /liability — paginated records
router.get('/', async (req: Request, res: Response) => {
  try {
    const mid = new mongoose.Types.ObjectId(req.merchantId);
    const query: unknown = { merchant: mid };
    if (req.query.cycleId) query.cycleId = req.query.cycleId;
    if (req.query.status) query.status = req.query.status;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [items, total, totals] = await Promise.all([
      MerchantLiability.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      MerchantLiability.countDocuments(query),
      MerchantLiability.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalIssued: { $sum: '$rewardIssued' },
            totalRedeemed: { $sum: '$rewardRedeemed' },
            totalPending: { $sum: '$pendingAmount' },
            totalSettled: { $sum: '$settledAmount' },
          },
        },
      ]),
    ]);

    const totalsRow = totals[0] || {
      totalIssued: 0,
      totalRedeemed: 0,
      totalPending: 0,
      totalSettled: 0,
    };

    res.json({
      success: true,
      data: {
        records: items,
        totals: totalsRow,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
        items,
        total,
        page,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /liability/instant — request instant settlement
router.post('/instant', async (req: Request, res: Response) => {
  try {
    const mid = new mongoose.Types.ObjectId(req.merchantId);
    const pending = await MerchantLiability.find({ merchant: mid, status: 'pending_settlement' }).lean();
    if (!pending.length) { res.status(400).json({ success: false, message: 'No pending balance' }); return; }

    const totalAmount = pending.reduce((sum, r) => sum + (r.pendingAmount || 0), 0);

    await MerchantLiability.updateMany(
      { merchant: mid, status: 'pending_settlement' },
      { $set: { status: 'settled', settlementDate: new Date().toISOString(), settlementTransactionId: `INSTANT-${Date.now()}` } },
    );

    res.json({ success: true, message: `Instant settlement of Rs.${totalAmount.toFixed(2)} queued`, data: { totalAmount, count: pending.length } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /liability/:cycleId/dispute — raise a dispute on a settlement cycle
// Also accessible via /settlements/:cycleId/dispute (aliased in support router)
router.post('/:cycleId/dispute', async (req: Request, res: Response) => {
  try {
    const { reason, description, attachments, needsFinanceReview } = req.body;
    if (!reason) {
      res.status(400).json({ success: false, message: 'reason is required' });
      return;
    }

    const mid = new mongoose.Types.ObjectId(req.merchantId);

    // Verify the liability cycle belongs to this merchant
    const cycle = await MerchantLiability.findOne({
      cycleId: req.params.cycleId,
      merchant: mid,
    }).lean() as unknown;

    if (!cycle) {
      res.status(404).json({ success: false, message: 'Settlement cycle not found' });
      return;
    }

    const { Dispute } = await import('../models/Dispute');
    const dispute = await Dispute.create({
      type: 'settlement',
      referenceType: 'settlement_cycle',
      referenceId: req.params.cycleId,
      merchantId: req.merchantId,
      reason,
      description: description || '',
      attachments: attachments || [],
      status: 'open',
      amount: cycle.pendingAmount || 0,
      needsFinanceReview: !!needsFinanceReview,
    });

    res.status(201).json({ success: true, data: dispute });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;

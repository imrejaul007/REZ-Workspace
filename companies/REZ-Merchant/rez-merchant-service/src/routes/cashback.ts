import { Router, Request, Response } from 'express';
import { Cashback } from '../models/Cashback';
import { AuditLog } from '../models/AuditLog';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import { redis } from '../config/redis';
import { createRateLimiter } from '@rez/shared';

const router = Router();
router.use(merchantAuth);

// HIGH FIX: Rate limit bulk cashback actions
const cashbackBulkLimiter = createRateLimiter(
  redis.call.bind(redis),
  {
    windowMs: 60 * 1000,
    max: 20,
    keyPrefix: 'rl:cashback:bulk',
    keyGenerator: (req) => `cashback-bulk:${req.merchantId || 'unknown'}`,
    message: 'Too many bulk actions. Please wait.',
  }
);

const CASHBACK_ALLOWED_FIELDS = [
  'customerId', 'orderId', 'storeId', 'amount', 'type',
  'description', 'percentage', 'minOrderAmount', 'maxAmount',
  'validFrom', 'validTo', 'metadata',
];

function pickCashbackFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of CASHBACK_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

// GET /cashback — list cashback requests
router.get('/', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const query: unknown = { merchantId };
    if (req.query.status) query.status = req.query.status;
    if (req.query.customerId) query.customerId = req.query.customerId;
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = { $gte: new Date(req.query.startDate as string), $lte: new Date(req.query.endDate as string) };
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Cashback.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Cashback.countDocuments(query),
    ]);

    res.json({ success: true, data: { requests: items, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /cashback/metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const metrics = await Cashback.aggregate([
      { $match: { merchantId } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      }},
    ]);
    res.json({ success: true, data: metrics });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /cashback/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const stats = await Cashback.aggregate([
      { $match: { merchantId } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);
    res.json({ success: true, data: { stats } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /cashback/transactions
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const items = await Cashback.find({ merchantId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    res.json({ success: true, data: items });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /cashback/summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const query: unknown = { merchantId };
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = { $gte: new Date(req.query.startDate as string), $lte: new Date(req.query.endDate as string) };
    }
    const summary = await Cashback.aggregate([
      { $match: query },
      { $group: {
        _id: null,
        totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
        totalPending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
        totalApproved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } },
        count: { $sum: 1 },
      }},
    ]);
    res.json({ success: true, data: summary[0] || { totalPaid: 0, totalPending: 0, totalApproved: 0, count: 0 } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /cashback/analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const analytics = await Cashback.aggregate([
      { $match: { merchantId } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      }},
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]);
    res.json({ success: true, data: analytics });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /cashback/export (H4 fix: frontend sends POST, changed from GET to match)
// Filters may arrive as query-string params (forwarded via POST ?key=val) or in the request body.
router.post('/export', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const rawStart = (req.query.startDate as string) || req.body?.startDate;
    const rawEnd   = (req.query.endDate   as string) || req.body?.endDate;
    const start = rawStart ? new Date(rawStart) : new Date(Date.now() - 90 * 86400000);
    const end   = rawEnd   ? new Date(rawEnd)   : new Date();

    const items = await Cashback.find({ merchantId, createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).limit(1000).lean();

    const headers = ['Date', 'ID', 'Status', 'Amount', 'Type'];
    const rows = items.map((t) => [
      new Date(t.createdAt).toLocaleDateString('en-IN'),
      t._id?.toString(),
      t.status || 'pending',
      (t.amount || 0).toFixed(2),
      t.type || 'cashback',
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="rez-cashback-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /cashback/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Cashback.findById(req.params.id).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Cashback not found' }); return; }
    if ((item as unknown).merchantId?.toString() !== req.merchantId?.toString()) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
    res.json({ success: true, data: item });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /cashback
router.post('/', async (req: Request, res: Response) => {
  try {
    // MERCH-AUDIT-3 FIX: Always set initial status to 'pending' — do not allow merchants to
    // set status directly at creation. 'status' was previously in CASHBACK_ALLOWED_FIELDS
    // which let merchants bypass the normal approval workflow by setting status='approved'.
    const item = await Cashback.create({ ...pickCashbackFields(req.body), merchantId: req.merchantId, status: 'pending' });
    res.status(201).json({ success: true, message: 'Cashback request created', data: item });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /cashback/:id/approve
router.put('/:id/approve', async (req: Request, res: Response) => {
  try {
    // MERCH-AUDIT-11 FIX: CAS guard — only approve if currently pending; prevents double-approval
    const item = await Cashback.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId, status: { $in: ['pending'] } },
      { $set: { status: 'approved', approvedAmount: req.body.approvedAmount, reviewedAt: new Date() } },
      { new: true },
    );
    if (!item) { res.status(400).json({ success: false, message: 'Not found or already processed' }); return; }
    res.json({ success: true, message: 'Approved', data: item });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /cashback/:id/reject
router.put('/:id/reject', async (req: Request, res: Response) => {
  try {
    const item = await Cashback.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: { status: 'rejected', rejectionReason: req.body.reason, reviewedAt: new Date() } },
      { new: true },
    );
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Rejected', data: item });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /cashback/:id/mark-paid
router.put('/:id/mark-paid', async (req: Request, res: Response) => {
  try {
    const item = await Cashback.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId, status: 'approved' },
      { $set: { status: 'paid', paidAt: new Date(), paymentMethod: req.body.paymentMethod, paymentReference: req.body.paymentReference } },
      { new: true },
    );
    if (!item) { res.status(400).json({ success: false, message: 'Not found or not approved' }); return; }
    res.json({ success: true, message: 'Marked as paid', data: item });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /cashback/bulk-action
router.post('/bulk-action', cashbackBulkLimiter, async (req: Request, res: Response) => {
  try {
    const { requestIds, action, rejectionReason } = req.body;
    if (!requestIds?.length) { res.status(400).json({ success: false, message: 'No IDs provided' }); return; }
    if (requestIds.length > 100) { res.status(400).json({ success: false, message: 'Cannot process more than 100 at once' }); return; }

    const update: unknown = { reviewedAt: new Date() };
    if (action === 'approve') update.status = 'approved';
    else if (action === 'reject') { update.status = 'rejected'; update.rejectionReason = rejectionReason; }
    else { res.status(400).json({ success: false, message: 'Invalid action' }); return; }

    const result = await Cashback.updateMany(
      { _id: { $in: requestIds }, merchantId: req.merchantId },
      { $set: update },
    );

    // HIGH FIX: Audit log for bulk cashback actions
    await AuditLog.create({
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
      merchantUserId: req.merchantUserId ? new mongoose.Types.ObjectId(req.merchantUserId) : undefined,
      action: `CASHBACK_BULK_${action.toUpperCase()}`,
      resourceType: 'cashback',
      resourceId: requestIds.join(','),
      severity: 'medium',
      details: { action, affectedCount: result.modifiedCount },
    }).catch((err) => logger.error('[cashback] Failed to write audit log for bulk cashback action', { merchantId: req.merchantId, action, error: err?.message }));

    res.json({ success: true, message: `Bulk ${action} completed`, data: { modified: result.modifiedCount } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;

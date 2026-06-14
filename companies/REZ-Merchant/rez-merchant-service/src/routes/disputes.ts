
import { Router, Request, Response } from 'express';
import { Dispute } from '../models/Dispute';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const query: unknown = { store: { $in: storeIds } };
    if (req.query.status) query.status = req.query.status;
    const [disputes, total] = await Promise.all([
      Dispute.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Dispute.countDocuments(query),
    ]);
    res.json({ success: true, data: { disputes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id.toString());
    const dispute = await Dispute.findById(req.params.id).lean() as unknown;
    if (!dispute) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    if (!storeIds.includes(dispute.store?.toString())) {
      res.status(403).json({ success: false, message: 'Access denied' }); return;
    }
    res.json({ success: true, data: dispute });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/:id/respond', async (req: Request, res: Response) => {
  try {
    const { response: text, attachments } = req.body;
    if (!text?.trim()) { res.status(400).json({ success: false, message: 'Response text required' }); return; }
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id.toString());
    const existing = await Dispute.findById(req.params.id).lean() as unknown;
    if (!existing) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    if (!storeIds.includes(existing.store?.toString())) {
      res.status(403).json({ success: false, message: 'Access denied' }); return;
    }
    const dispute = await Dispute.findByIdAndUpdate(req.params.id, { $set: { merchantResponse: { text: text.trim(), attachments: attachments || [], respondedAt: new Date() }, status: 'under_review' } }, { new: true });
    res.json({ success: true, data: dispute });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// PATCH /:id — merchant approves or rejects a dispute.
// Used by the merchant app "Approve"/"Reject" buttons on the disputes screen.
// Maps UI-friendly status aliases to the canonical Dispute enum values.
const STATUS_ALIASES: Record<string, string> = {
  resolved: 'resolved_refund',
  rejected: 'resolved_reject',
  resolved_refund: 'resolved_refund',
  resolved_reject: 'resolved_reject',
};
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { status: rawStatus, notes } = req.body as { status?: string; notes?: string };
    if (!rawStatus || !STATUS_ALIASES[rawStatus]) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed: resolved, rejected',
      });
      return;
    }
    const status = STATUS_ALIASES[rawStatus];

    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id.toString());

    const existing = await Dispute.findById(req.params.id).lean() as unknown;
    if (!existing) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    if (!storeIds.includes(existing.store?.toString())) {
      res.status(403).json({ success: false, message: 'Access denied' }); return;
    }

    const update: unknown = { $set: { status, updatedAt: new Date() } };
    if (notes && notes.trim()) {
      update.$set['merchantResponse'] = {
        ...(existing.merchantResponse || {}),
        text: notes.trim(),
        respondedAt: new Date(),
      };
      // Track the action in the timeline if the canonical model has one.
      update.$push = {
        timeline: {
          action: `merchant_${status}`,
          note: notes.trim(),
          at: new Date(),
        },
      };
    }

    const dispute = await Dispute.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: dispute });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;

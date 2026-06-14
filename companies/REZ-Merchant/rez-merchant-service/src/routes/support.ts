
import { Router, Request, Response } from 'express';
import { SupportTicket } from '../models/SupportTicket';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

async function getMerchantStoreIds(merchantId: string) {
  const stores = await Store.find({ merchantId: merchantId }).select('_id').lean();
  return stores.map((s) => s._id);
}

// GET /support/tickets
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    if (!storeIds.length) { res.json({ success: true, data: { tickets: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } } }); return; }

    const query: unknown = { merchant: { $in: storeIds } };
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
    if (req.query.category && req.query.category !== 'all') query.category = req.query.category;
    if (req.query.search) {
      const s = String(req.query.search).substring(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ ticketNumber: { $regex: s, $options: 'i' } }, { subject: { $regex: s, $options: 'i' } }];
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      SupportTicket.countDocuments(query),
    ]);

    res.json({ success: true, data: { tickets, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /support/tickets/:id
router.get('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const ticket = await SupportTicket.findOne({ _id: req.params.id, merchant: { $in: storeIds } }).lean();
    if (!ticket) { res.status(404).json({ success: false, message: 'Ticket not found' }); return; }
    res.json({ success: true, data: { ticket } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /support/tickets/:id/messages
router.post('/tickets/:id/messages', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const ticket = await SupportTicket.findOne({ _id: req.params.id, merchant: { $in: storeIds } });
    if (!ticket) { res.status(404).json({ success: false, message: 'Ticket not found' }); return; }

    const { message, attachments } = req.body;
    if (!message?.trim()) { res.status(400).json({ success: false, message: 'Message required' }); return; }

    (ticket as unknown).messages.push({
      sender: new mongoose.Types.ObjectId(req.merchantId),
      senderType: 'agent',
      message: message.trim().substring(0, 5000),
      attachments: attachments || [],
      timestamp: new Date(),
      isRead: false,
    });
    await ticket.save();

    res.json({ success: true, data: { ticket }, message: 'Reply sent' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /support/statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    if (!storeIds.length) { res.json({ success: true, data: { total: 0, byStatus: {}, byCategory: {} } }); return; }

    const [total, byStatus, byCategory] = await Promise.all([
      SupportTicket.countDocuments({ merchant: { $in: storeIds } }),
      SupportTicket.aggregate([{ $match: { merchant: { $in: storeIds } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      SupportTicket.aggregate([{ $match: { merchant: { $in: storeIds } } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((s) => { statusMap[s._id] = s.count; });
    const catMap: Record<string, number> = {};
    byCategory.forEach((c) => { catMap[c._id] = c.count; });

    res.json({ success: true, data: { total, byStatus: statusMap, byCategory: catMap, openCount: statusMap.open || 0, inProgressCount: statusMap.in_progress || 0 } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;

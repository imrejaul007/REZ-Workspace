
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { CustomerCredit } from '../models/CustomerCredit';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.search) {
      const s = (req.query.search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ customerName: { $regex: s, $options: 'i' } }, { customerPhone: { $regex: s, $options: 'i' } }];
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [customers, total] = await Promise.all([
      CustomerCredit.find(query).sort({ lastActivityAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      CustomerCredit.countDocuments(query),
    ]);
    res.json({ success: true, data: { customers, total, page, limit } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { customerPhone, customerName, amount, note, storeId } = req.body;

    // MERCH-AUDIT-3 FIX: Validate required fields
    if (!customerPhone || !customerName) {
      res.status(400).json({ success: false, message: 'customerPhone and customerName are required' });
      return;
    }

    // MERCH-AUDIT-3 FIX: Validate amount — must be a finite positive number within reasonable bounds
    if (amount === undefined || amount === null) {
      res.status(400).json({ success: false, message: 'amount is required' });
      return;
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      res.status(400).json({ success: false, message: 'amount must be a finite number' });
      return;
    }
    if (amount <= 0) {
      res.status(400).json({ success: false, message: 'amount must be greater than 0' });
      return;
    }
    if (amount > 99999999) {
      res.status(400).json({ success: false, message: 'amount exceeds maximum allowed value (99999999)' });
      return;
    }

    // MERCH-AUDIT-3 FIX: Validate storeId is a valid ObjectId belonging to this merchant
    if (storeId !== undefined && storeId !== null) {
      if (!mongoose.Types.ObjectId.isValid(storeId)) {
        res.status(400).json({ success: false, message: 'storeId must be a valid ObjectId' });
        return;
      }
      const store = await Store.findOne(
        { _id: storeId, $or: [{ merchant: req.merchantId }, { merchantId: req.merchantId }] },
        '_id',
      ).lean();
      if (!store) {
        res.status(403).json({ success: false, message: 'storeId does not belong to this merchant' });
        return;
      }
    }

    const entry = await CustomerCredit.findOneAndUpdate(
      { merchantId: req.merchantId, customerPhone },
      { $setOnInsert: { merchantId: req.merchantId, storeId, customerPhone, customerName }, $inc: { balance: amount }, $push: { transactions: { amount, type: 'credit', note, date: new Date() } }, $set: { lastActivityAt: new Date() } },
      { upsert: true, new: true },
    );
    res.json({ success: true, data: entry });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:customerId', async (req: Request, res: Response) => {
  try {
    const entry = await CustomerCredit.findOne({ _id: req.params.customerId, merchantId: req.merchantId }).lean();
    if (!entry) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: entry });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/:customerId/payment', async (req: Request, res: Response) => {
  try {
    const { amount, note } = req.body;

    // MERCH-AUDIT-3 FIX: Validate amount — must be a finite positive number within reasonable bounds
    if (amount === undefined || amount === null) {
      res.status(400).json({ success: false, message: 'amount is required' });
      return;
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      res.status(400).json({ success: false, message: 'amount must be a finite number' });
      return;
    }
    if (amount <= 0) {
      res.status(400).json({ success: false, message: 'amount must be greater than 0' });
      return;
    }
    if (amount > 99999999) {
      res.status(400).json({ success: false, message: 'amount exceeds maximum allowed value (99999999)' });
      return;
    }

    // MERCH-AUDIT-11 FIX: Atomic balance floor check — reject if insufficient balance
    const entry = await CustomerCredit.findOneAndUpdate(
      { _id: req.params.customerId, merchantId: req.merchantId, balance: { $gte: amount } },
      { $inc: { balance: -amount }, $push: { transactions: { amount, type: 'payment', note, date: new Date() } }, $set: { lastActivityAt: new Date() } },
      { new: true },
    );
    if (!entry) { res.status(400).json({ success: false, message: 'Insufficient balance or customer not found' }); return; }
    res.json({ success: true, data: entry });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;

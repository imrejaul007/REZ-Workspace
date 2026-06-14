
import { Router, Request, Response } from 'express';
import { Subscription } from '../models/Subscription';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      Subscription.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Subscription.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Subscription.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const SUB_ALLOWED = ['name', 'description', 'price', 'billingCycle', 'features', 'isActive', 'maxMembers', 'trialDays', 'storeId'];
    const safe: Record<string, unknown> = {};
    for (const f of SUB_ALLOWED) { if ((req.body as unknown)[f] !== undefined) safe[f] = (req.body as unknown)[f]; }
    const item = await Subscription.create({ ...safe, merchantId: req.merchantId });
    res.status(201).json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    // MS-11: Field whitelist prevents overwriting plan billing internals (subscriberCount, revenue, etc.)
    const SUB_ALLOWED = ['name', 'description', 'price', 'billingCycle', 'features', 'isActive', 'maxMembers', 'trialDays', 'storeId'];
    const update: Record<string, unknown> = {};
    for (const f of SUB_ALLOWED) { if ((req.body as unknown)[f] !== undefined) update[f] = (req.body as unknown)[f]; }
    const item = await Subscription.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: update }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Subscription.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /subscription/plans — return static plan catalog
router.get('/plans', async (req: Request, res: Response) => {
  const plans = [
    { _id: 'plan-starter', plan: 'starter', monthlyPrice: 0, maxProducts: 50, maxStores: 1, smsPerMonth: 100, whatsappPerMonth: 50, pushPerMonth: 200, analyticsRetentionDays: 7 },
    { _id: 'plan-growth', plan: 'growth', monthlyPrice: 999, maxProducts: 500, maxStores: 3, smsPerMonth: 500, whatsappPerMonth: 300, pushPerMonth: 1000, analyticsRetentionDays: 30 },
    { _id: 'plan-pro', plan: 'pro', monthlyPrice: 2999, maxProducts: 9999, maxStores: 10, smsPerMonth: 2000, whatsappPerMonth: 1000, pushPerMonth: 5000, analyticsRetentionDays: 90 },
  ];
  res.json({ success: true, data: plans });
});

// GET /subscription/usage — merchant's current usage vs plan limits
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const Store = (await import('../models/Store')).Store;
    const Product = (await import('../models/Product')).Product;
    const Merchant = (await import('../models/Merchant')).Merchant;

    const [stores, products, merchant] = await Promise.all([
      Store.countDocuments({ merchantId: req.merchantId }).lean(),
      Product.countDocuments({ merchantId: req.merchantId }).lean(),
      Merchant.findById(req.merchantId).select('currentPlan planExpiresAt').lean(),
    ]);

    const plan = ((merchant as unknown)?.currentPlan as string) || 'starter';
    const planLimits: Record<string, { maxProducts: number; maxStores: number }> = {
      starter: { maxProducts: 50, maxStores: 1 },
      growth: { maxProducts: 500, maxStores: 3 },
      pro: { maxProducts: 9999, maxStores: 10 },
    };
    const limits = planLimits[plan] || planLimits.starter;

    res.json({
      success: true,
      data: {
        currentPlan: plan,
        planExpiresAt: (merchant as unknown)?.planExpiresAt || null,
        usage: { products, stores },
        limits,
      },
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /subscription — current plan, usage, invoices (superset for app/subscription/index.tsx)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const Store = (await import('../models/Store')).Store;
    const Product = (await import('../models/Product')).Product;
    const SubscriptionModel = (await import('../models/Subscription')).Subscription;
    const Merchant = (await import('../models/Merchant')).Merchant;

    const [stores, products, subscriptions, merchant] = await Promise.all([
      Store.countDocuments({ merchantId: req.merchantId }).lean(),
      Product.countDocuments({ merchantId: req.merchantId }).lean(),
      SubscriptionModel.find({ merchantId: req.merchantId }).sort({ createdAt: -1 }).limit(10).lean(),
      Merchant.findById(req.merchantId).select('currentPlan planExpiresAt').lean(),
    ]);

    const plan = ((merchant as unknown)?.currentPlan as string) || 'starter';
    const planLimits: Record<string, { maxProducts: number; maxStores: number }> = {
      starter: { maxProducts: 50, maxStores: 1 },
      growth: { maxProducts: 500, maxStores: 3 },
      pro: { maxProducts: 9999, maxStores: 10 },
    };
    const limits = planLimits[plan] || planLimits.starter;

    const invoices = subscriptions.map((s) => ({
      id: s._id.toString(),
      date: s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : 'N/A',
      amount: (s as unknown).price || 0,
      status: ((s as unknown).status === 'active' || (s as unknown).status === 'paid') ? 'paid' : 'pending',
    }));

    res.json({
      success: true,
      data: {
        plan,
        planLabel: plan.charAt(0).toUpperCase() + plan.slice(1),
        nextBillingDate: (merchant as unknown)?.planExpiresAt || null,
        usage: {
          staff: 1,
          staffLimit: 5,
          products,
          productsLimit: limits.maxProducts,
          monthlyBookings: 0,
          monthlyBookingsLimit: 100,
        },
        invoices,
      },
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// POST /subscription/upgrade — create Razorpay order
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const { planName } = req.body as { planName?: string };
    if (!planName || !['starter', 'growth', 'pro'].includes(planName)) {
      res.status(400).json({ success: false, message: 'Invalid plan name' });
      return;
    }

    const planPrices: Record<string, number> = { starter: 0, growth: 99900, pro: 299900 };
    const amount = planPrices[planName] || 0;

    if (amount === 0) {
      const Merchant = (await import('../models/Merchant')).Merchant;
      await Merchant.findByIdAndUpdate(req.merchantId, {
        currentPlan: planName,
        planExpiresAt: null,
      });
      res.json({ success: true, data: { razorpayOrderId: null, amountInPaise: 0, currency: 'INR', keyId: '', planName } });
      return;
    }

    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const receipt = `sub_${req.merchantId}_${Date.now()}`;

    // Use Razorpay Orders API via raw HTTP
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        notes: { planName, merchantId: req.merchantId },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      res.status(500).json({ success: false, message: `Razorpay error: ${errBody}` });
      return;
    }

    const order = await response.json() as { id: string; amount: number; currency: string };

    res.json({
      success: true,
      data: {
        razorpayOrderId: order.id,
        amountInPaise: order.amount,
        currency: order.currency,
        keyId,
        planName,
      },
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// POST /subscription/verify-payment — verify Razorpay HMAC signature
router.post('/verify-payment', async (req: Request, res: Response) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planName } = req.body as unknown;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      res.status(400).json({ success: false, message: 'Missing payment verification fields' });
      return;
    }

    // FIX-14: Replay attack prevention — validate webhook timestamp within 5-minute window
    const webhookTimestamp = req.headers['x-razorpay-timestamp'] as string;
    if (webhookTimestamp) {
      const diff = Math.abs(Date.now() - parseInt(webhookTimestamp, 10) * 1000);
      if (diff > 5 * 60 * 1000) {
        res.status(400).json({ success: false, message: 'Stale webhook' });
        return;
      }
    }

    // FIX-14: Idempotency — prevent duplicate payment processing via Redis dedup
    const redis = (await import('../config/redis')).redis;
    const processedKey = `razorpay:processed:${razorpay_payment_id}`;
    const alreadyProcessed = await redis.get(processedKey);
    if (alreadyProcessed) {
      res.json({ success: true, message: 'Already processed' });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const crypto = require('crypto');
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
      return;
    }

    const Merchant = (await import('../models/Merchant')).Merchant;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await Merchant.findByIdAndUpdate(req.merchantId, {
      currentPlan: planName || 'starter',
      planExpiresAt: expiresAt,
    });

    // FIX-14: Mark payment as processed in Redis with 24h TTL to prevent replays
    await redis.setex(processedKey, 86400, '1');

    res.json({ success: true, message: 'Payment verified and plan updated' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;

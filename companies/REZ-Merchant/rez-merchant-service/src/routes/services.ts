
import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { ServiceCategory } from '../models/ServiceCategory';
import { ServiceBooking } from '../models/ServiceBooking';
import { BlockedSlot } from '../models/BlockedSlot';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';
import { randomUUID, randomInt } from 'crypto';

const router = Router();
router.use(merchantAuth);

// GET /services — list merchant services (products with type=service)
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { productType: 'service', isDeleted: { $ne: true } };
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    query.store = { $in: stores.map((s) => s._id) };
    if (req.query.storeId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.storeId as string)) {
        res.status(400).json({ success: false, message: 'Invalid storeId' }); return;
      }
      query.store = new mongoose.Types.ObjectId(req.query.storeId as string);
    }
    if (req.query.status === 'active') query.isActive = true;
    if (req.query.status === 'inactive') query.isActive = false;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [items, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /services — create service
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, price, storeId, serviceCategoryId, ...rest } = req.body;
    if (!name || !price || !storeId) { res.status(400).json({ success: false, message: 'name, price, storeId required' }); return; }

    const store = await Store.findOne({ _id: storeId, merchantId: req.merchantId });
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }

    const sku = `SVC-${Date.now()}-${randomInt(1000, 9999)}`;
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') + '-' + Date.now();

    const service = new Product({
      name, slug, ...rest,
      productType: 'service',
      store: storeId,
      merchantId: req.merchantId,
      sku,
      pricing: { original: rest.originalPrice || price, selling: price, currency: 'INR' },
      inventory: { stock: 999, isAvailable: true, unlimited: true },
      serviceDetails: { duration: rest.duration || 60, serviceType: rest.serviceType || 'store' },
      isActive: true,
    });
    await service.save();

    res.status(201).json({ success: true, message: 'Service created', data: service });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /services/categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await ServiceCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
    res.json({ success: true, data: categories });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// GET /services/bookings
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const query: unknown = { store: { $in: storeIds } };
    if (req.query.status) query.status = req.query.status;
    if (req.query.storeId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.storeId as string)) {
        res.status(400).json({ success: false, message: 'Invalid storeId' }); return;
      }
      query.store = new mongoose.Types.ObjectId(req.query.storeId as string);
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [bookings, total] = await Promise.all([
      ServiceBooking.find(query).sort({ bookingDate: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      ServiceBooking.countDocuments(query),
    ]);

    res.json({ success: true, data: bookings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /services/bookings/:id/status
router.put('/bookings/:id/status', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const booking = await ServiceBooking.findOneAndUpdate(
      { _id: req.params.id, store: { $in: storeIds } },
      { $set: { status: req.body.status } },
      { new: true },
    );
    if (!booking) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    res.json({ success: true, message: `Booking ${req.body.status}`, data: booking });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /services/bookings/:id/no-show
router.post('/bookings/:id/no-show', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const booking = await ServiceBooking.findOneAndUpdate(
      { _id: req.params.id, store: { $in: storeIds } },
      { $set: { status: 'no_show', noShowMarkedAt: new Date() } },
      { new: true },
    );
    if (!booking) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    res.json({ success: true, message: 'Marked as no-show', data: booking });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /services/bookings/stats
router.get('/bookings/stats', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const days = parseInt(req.query.period as string) || 30;
    const since = new Date(Date.now() - days * 86400000);

    const stats = await ServiceBooking.aggregate([
      { $match: { store: { $in: stores.map((s) => s._id) }, createdAt: { $gte: since } } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$pricing.total', 0] } } } },
    ]);

    res.json({ success: true, data: stats });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /services/blocked-slots
router.get('/blocked-slots', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.storeId as string)) {
        res.status(400).json({ success: false, message: 'Invalid storeId' }); return;
      }
      query.storeId = new mongoose.Types.ObjectId(req.query.storeId as string);
    }
    const slots = await BlockedSlot.find(query).sort({ date: 1 }).lean();
    res.json({ success: true, data: { slots, total: slots.length } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /services/blocked-slots
router.post('/blocked-slots', async (req: Request, res: Response) => {
  try {
    const { storeId, date, startTime, endTime, reason, isAllDay } = req.body;
    if (!storeId || !date) { res.status(400).json({ success: false, message: 'storeId and date required' }); return; }
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      res.status(400).json({ success: false, message: 'Invalid storeId' }); return;
    }
    // SEC-003 FIX: Verify store belongs to this merchant before creating slot
    const store = await Store.findOne({
      _id: new mongoose.Types.ObjectId(storeId),
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
    }).lean();
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }
    const slot = await BlockedSlot.create({
      merchantId: req.merchantId,
      storeId: new mongoose.Types.ObjectId(storeId),
      date: new Date(date),
      startTime: isAllDay ? '00:00' : startTime,
      endTime: isAllDay ? '23:59' : endTime,
      reason,
      isAllDay: !!isAllDay,
    });
    res.status(201).json({ success: true, data: slot, message: 'Slot blocked' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /services/blocked-slots/:id
router.delete('/blocked-slots/:id', async (req: Request, res: Response) => {
  try {
    const slot = await BlockedSlot.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!slot) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Unblocked' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /services/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const SERVICE_ALLOWED = [
      'name', 'description', 'price', 'originalPrice', 'images', 'isActive', 'isAvailable',
      'tags', 'sku', 'preparationTime', 'serviceDetails', 'inventory', 'variants',
      'cashbackPercent', 'gstRate', 'hsnCode', 'sortOrder', 'category', 'subCategory',
    ];
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const update: Record<string, unknown> = {};
    for (const f of SERVICE_ALLOWED) { if ((req.body as unknown)[f] !== undefined) update[f] = (req.body as unknown)[f]; }
    const service = await Product.findOneAndUpdate(
      { _id: req.params.id, productType: 'service', isDeleted: { $ne: true }, store: { $in: storeIds } },
      { $set: update },
      { new: true },
    );
    if (!service) { res.status(404).json({ success: false, message: 'Service not found' }); return; }
    res.json({ success: true, message: 'Service updated', data: service });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /services/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const service = await Product.findOneAndUpdate(
      { _id: req.params.id, productType: 'service', isDeleted: { $ne: true }, store: { $in: storeIds } },
      { $set: { isDeleted: true, deletedAt: new Date(), isActive: false } },
      { new: true },
    );
    if (!service) { res.status(404).json({ success: false, message: 'Service not found' }); return; }
    res.json({ success: true, message: 'Service deleted' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /services/:id — MUST be after /bookings, /categories, /blocked-slots
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const service = await Product.findOne({
      _id: req.params.id,
      productType: 'service',
      isDeleted: { $ne: true },
      store: { $in: storeIds },
    }).lean();
    if (!service) { res.status(404).json({ success: false, message: 'Service not found' }); return; }
    res.json({ success: true, data: service });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;

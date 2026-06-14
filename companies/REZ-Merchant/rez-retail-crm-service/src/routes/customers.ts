import { Router, Request, Response, NextFunction } from 'express';
import { Customer, Interaction } from '../models';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/customers - List all customers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { segment, storeId, search, page = '1', limit = '50', isActive } = req.query;

    const query: any = {};
    if (segment) query.segment = segment;
    if (storeId) query.storeId = storeId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .populate('storeId', 'name code')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Customer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id - Get single customer
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('storeId', 'name code address');

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/phone/:phone - Get by phone
router.get('/phone/:phone', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone })
      .populate('storeId', 'name code');

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

// POST /api/customers - Create customer
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.body.customerId || `CUST-${uuidv4().slice(0, 8).toUpperCase()}`;

    const existing = await Customer.findOne({ phone: req.body.phone });
    if (existing) {
      res.status(409).json({ success: false, error: 'Customer with this phone already exists' });
      return;
    }

    const customer = new Customer({
      ...req.body,
      customerId: customerId.toUpperCase(),
      segment: 'new',
    });
    await customer.save();

    logger.info('Customer created', { customerId: customer.customerId, name: customer.name });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    logger.info('Customer updated', { customerId: customer.customerId });

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/customers/:id/segment - Update segment
router.patch('/:id/segment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { segment } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: { segment } },
      { new: true }
    );

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    logger.info('Customer segment updated', { customerId: customer.customerId, segment });

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

// POST /api/customers/:id/tags - Add tags
router.post('/:id/tags', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tags } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { tags: { $each: tags } } },
      { new: true }
    );

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/customers/:id/tags/:tag - Remove tag
router.delete('/:id/tags/:tag', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $pull: { tags: req.params.tag } },
      { new: true }
    );

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id/lifetime-value - Get LTV
router.get('/:id/lifetime-value', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    const recentPurchases = await Interaction.countDocuments({
      customerId: req.params.id,
      type: 'purchase',
      createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    });

    const avgOrderValue = customer.totalPurchases > 0 ? customer.totalSpent / customer.totalPurchases : 0;
    const expectedRemainingPurchases = Math.max(0, 365 - Math.floor((Date.now() - (customer.lastPurchaseDate?.getTime() || Date.now())) / (24 * 60 * 60 * 1000))) / 30;
    const predictedLTV = avgOrderValue * expectedRemainingPurchases * 0.7;

    res.json({
      success: true,
      data: {
        currentLTV: customer.lifetimeValue,
        totalSpent: customer.totalSpent,
        totalPurchases: customer.totalPurchases,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        lastPurchaseDate: customer.lastPurchaseDate,
        recentPurchases,
        predictedLTV: Math.round(predictedLTV * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/segments - Get segment breakdown
router.get('/segments/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segments = await Customer.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$segment', count: { $sum: 1 }, totalSpent: { $sum: '$totalSpent' }, avgLTV: { $avg: '$lifetimeValue' } } },
      { $sort: { count: -1 } },
    ]);

    const total = segments.reduce((sum, s) => sum + s.count, 0);

    res.json({
      success: true,
      data: segments.map(s => ({
        segment: s._id,
        count: s.count,
        percentage: Math.round((s.count / total) * 100 * 100) / 100,
        totalSpent: s.totalSpent,
        avgLTV: Math.round(s.avgLTV * 100) / 100,
      })),
      total,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
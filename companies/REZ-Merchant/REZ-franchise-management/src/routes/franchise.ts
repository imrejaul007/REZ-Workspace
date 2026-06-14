import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Franchise, FranchiseUser, FranchisePerformance } from '../models/Franchise';
import { InventorySyncService } from '../services/InventorySync';
import { MenuSyncService } from '../services/MenuSync';
import { logger } from '../config/logger';

const router = Router();

// Validation schemas
const createFranchiseSchema = z.object({
  name: z.string().min(1),
  franchiseCode: z.string().min(1),
  ownerId: z.string().min(1),
  type: z.enum(['owned', 'franchise']),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    landmark: z.string().optional(),
  }),
  contact: z.object({
    phone: z.string().min(1),
    email: z.string().email(),
    managerName: z.string().optional(),
  }),
  license: z.object({
    gst: z.string().min(1),
    pan: z.string().min(1),
  }),
});

const updateFranchiseSchema = createFranchiseSchema.partial();

// ==================== FRANCHISE ROUTES ====================

// Get all franchises
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, city, type, search } = req.query;
    const query: Record<string, any> {};

    if (status) query.status = status;
    if (city) query['address.city'] = city;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { franchiseCode: { $regex: search, $options: 'i' } },
      ];
    }

    const franchises = await Franchise.find(query)
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: franchises, count: franchises.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch franchises' } });
  }
});

// Get franchise by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const franchise = await Franchise.findById(req.params.id)
      .populate('ownerId', 'name email phone');

    if (!franchise) {
      return res.status(404).json({ success: false, error: { message: 'Franchise not found' } });
    }

    res.json({ success: true, data: franchise });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch franchise' } });
  }
});

// Get franchise by code
router.get('/code/:code', async (req: Request, res: Response) => {
  try {
    const franchise = await Franchise.findOne({ franchiseCode: req.params.code })
      .populate('ownerId', 'name email phone');

    if (!franchise) {
      return res.status(404).json({ success: false, error: { message: 'Franchise not found' } });
    }

    res.json({ success: true, data: franchise });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch franchise' } });
  }
});

// Create franchise
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createFranchiseSchema.parse(req.body);

    const franchise = await Franchise.create(validatedData);

    logger.info('Franchise created', { franchiseId: franchise._id, code: franchise.franchiseCode });

    res.status(201).json({ success: true, data: franchise });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Validation error', details: error.errors } });
    }
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Update franchise
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const franchise = await Franchise.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!franchise) {
      return res.status(404).json({ success: false, error: { message: 'Franchise not found' } });
    }

    logger.info('Franchise updated', { franchiseId: franchise._id });

    res.json({ success: true, data: franchise });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Update franchise status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid status' } });
    }

    const franchise = await Franchise.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!franchise) {
      return res.status(404).json({ success: false, error: { message: 'Franchise not found' } });
    }

    logger.info('Franchise status updated', { franchiseId: franchise._id, status });

    res.json({ success: true, data: franchise });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Delete franchise (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const franchise = await Franchise.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: 'inactive' },
      { new: true }
    );

    if (!franchise) {
      return res.status(404).json({ success: false, error: { message: 'Franchise not found' } });
    }

    res.json({ success: true, message: 'Franchise deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// ==================== FRANCHISE USER ROUTES ====================

// Add user to franchise
router.post('/:id/users', async (req: Request, res: Response) => {
  try {
    const { userId, role, permissions } = req.body;

    const franchiseUser = await FranchiseUser.create({
      franchiseId: req.params.id,
      userId,
      role: role || 'staff',
      permissions: permissions || [],
    });

    res.status(201).json({ success: true, data: franchiseUser });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Get franchise users
router.get('/:id/users', async (req: Request, res: Response) => {
  try {
    const users = await FranchiseUser.find({ franchiseId: req.params.id })
      .populate('userId', 'name email phone')
      .sort({ role: 1 });

    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch users' } });
  }
});

// Remove user from franchise
router.delete('/:franchiseId/users/:userId', async (req: Request, res: Response) => {
  try {
    await FranchiseUser.deleteOne({
      franchiseId: req.params.franchiseId,
      userId: req.params.userId,
    });

    res.json({ success: true, message: 'User removed from franchise' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// ==================== PERFORMANCE ROUTES ====================

// Get franchise performance
router.get('/:id/performance', async (req: Request, res: Response) => {
  try {
    const { period, startDate, endDate } = req.query;
    const query: Record<string, any> = { franchiseId: req.params.id };

    if (period) query.period = period;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const performance = await FranchisePerformance.find(query)
      .sort({ date: -1 })
      .limit(100);

    res.json({ success: true, data: performance, count: performance.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch performance' } });
  }
});

// Get aggregate performance
router.get('/:id/performance/summary', async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const summary = await FranchisePerformance.aggregate([
      {
        $match: {
          franchiseId: require('mongoose').Types.ObjectId.createFromHexString(req.params.id),
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: '$metrics.orders' },
          totalRevenue: { $sum: '$metrics.revenue' },
          avgOrderValue: { $avg: '$metrics.avgOrderValue' },
          avgRating: { $avg: '$metrics.ratings.avg' },
          totalCustomers: { $sum: '$metrics.customerCount' },
        },
      },
    ]);

    res.json({ success: true, data: summary[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch summary' } });
  }
});

// ==================== SYNC ROUTES ====================

// Trigger inventory sync
router.post('/:id/sync/inventory', async (req: Request, res: Response) => {
  try {
    const syncService = InventorySyncService.getInstance();
    await syncService.syncInventory(req.params.id);

    res.json({ success: true, message: 'Inventory sync triggered' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Sync failed' } });
  }
});

// Trigger menu sync
router.post('/:id/sync/menu', async (req: Request, res: Response) => {
  try {
    const syncService = MenuSyncService.getInstance();
    await syncService.syncMenu(req.params.id);

    res.json({ success: true, message: 'Menu sync triggered' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Sync failed' } });
  }
});

// ==================== LOCATIONS ROUTES ====================

// Get all franchise locations
router.get('/locations/all', async (req: Request, res: Response) => {
  try {
    const { city, state } = req.query;
    const query: Record<string, any> = { isActive: true };

    if (city) query['address.city'] = city;
    if (state) query['address.state'] = state;

    const franchises = await Franchise.find(query)
      .select('name franchiseCode address contact status type')
      .sort({ 'address.city': 1, name: 1 });

    res.json({ success: true, data: franchises, count: franchises.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch locations' } });
  }
});

// ==================== REVENUE ROUTES ====================

// Get franchise revenue
router.get('/:id/revenue', async (req: Request, res: Response) => {
  try {
    const { period } = req.query;

    const matchStage: Record<string, any> = { franchiseId: req.params.id };

    if (period === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchStage.date = { $gte: today };
    } else if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchStage.date = { $gte: weekAgo };
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchStage.date = { $gte: monthAgo };
    }

    const revenue = await FranchisePerformance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$metrics.revenue' },
          totalOrders: { $sum: '$metrics.orders' },
          avgOrderValue: { $avg: '$metrics.avgOrderValue' },
        },
      },
    ]);

    res.json({ success: true, data: revenue[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch revenue' } });
  }
});

export default router;

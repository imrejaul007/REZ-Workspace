import { Router, Request, Response, NextFunction } from 'express';
import { Store, Employee } from '../models';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createStoreSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['retail', 'warehouse', 'popup']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  location: z.object({
    type: z.enum(['Point']).optional(),
    coordinates: z.array(z.number()).optional(),
  }).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  managerId: z.string().optional(),
  operatingHours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    isClosed: z.boolean(),
  })).optional(),
});

// GET /api/stores - List all stores
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, city, isActive } = req.query;

    const query: any = {};
    if (type) query.type = type;
    if (city) query['address.city'] = city;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const stores = await Store.find(query)
      .populate('managerId', 'name employeeId')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: stores,
      count: stores.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/stores/:id - Get single store
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('managerId', 'name employeeId phone email');

    if (!store) {
      res.status(404).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/stores/code/:code - Get by code
router.get('/code/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findOne({ code: req.params.code.toUpperCase() })
      .populate('managerId', 'name employeeId phone email');

    if (!store) {
      res.status(404).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/stores - Create store
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existingStore = await Store.findOne({ code: req.body.code.toUpperCase() });
    if (existingStore) {
      res.status(409).json({
        success: false,
        error: 'Store with this code already exists',
      });
      return;
    }

    const store = new Store({
      ...req.body,
      code: req.body.code.toUpperCase(),
    });
    await store.save();

    logger.info('Store created', { storeId: store._id, code: store.code });

    res.status(201).json({
      success: true,
      data: store,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/stores/:id - Update store
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!store) {
      res.status(404).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    logger.info('Store updated', { storeId: store._id });

    res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/stores/:id - Deactivate store
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!store) {
      res.status(404).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    logger.info('Store deactivated', { storeId: store._id });

    res.json({
      success: true,
      message: 'Store deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/stores/:id/employees - Get store employees
router.get('/:id/employees', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employees = await Employee.find({ storeId: req.params.id, isActive: true })
      .select('employeeId name role phone email')
      .sort({ role: 1, name: 1 });

    res.json({
      success: true,
      data: employees,
      count: employees.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/stores/:id/overview - Store overview (for dashboard)
router.get('/:id/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      res.status(404).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    const employeeCount = await Employee.countDocuments({ storeId: req.params.id, isActive: true });

    const overview = {
      store: {
        id: store._id,
        name: store.name,
        code: store.code,
        type: store.type,
        address: store.address,
      },
      metrics: {
        employeeCount,
        activeEmployees: employeeCount,
      },
    };

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
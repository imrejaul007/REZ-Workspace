import { Router, Request, Response, NextFunction } from 'express';
import { Store, CreateStoreSchema, UpdateStoreSchema, UpdateStatusSchema, formatStoreResponse } from '../models';

const router = Router();

// ============================================
// Validation Middleware
// ============================================

const validateRequest = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors?.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
  };
};

// ============================================
// Error Handler Wrapper
// ============================================

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// CRUD Routes
// ============================================

/**
 * POST / - Create a new store
 */
router.post(
  '/',
  validateRequest(CreateStoreSchema),
  asyncHandler(async (req, res) => {
    const storeData = req.body;

    // Check if storeId already exists
    const existingStore = await Store.findOne({ storeId: storeData.storeId });
    if (existingStore) {
      res.status(409).json({
        success: false,
        error: 'Store with this ID already exists',
      });
      return;
    }

    const store = new Store(storeData);
    await store.save();

    res.status(201).json({
      success: true,
      data: formatStoreResponse(store),
      message: 'Store created successfully',
    });
  })
);

/**
 * GET / - List all stores
 * Query params: status, category, city, limit, skip
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, category, city, limit = 50, skip = 0 } = req.query;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.categories = category;
    }

    if (city) {
      filter['address.city'] = city;
    }

    const stores = await Store.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await Store.countDocuments(filter);

    res.json({
      success: true,
      data: stores.map(formatStoreResponse),
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: Number(skip) + stores.length < total,
      },
    });
  })
);

/**
 * GET /:id - Get store by ID (storeId or MongoDB _id)
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    let store = await Store.findOne({ storeId: id });

    if (!store) {
      store = await Store.findById(id);
    }

    if (!store) {
      res.status(404).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    res.json({
      success: true,
      data: formatStoreResponse(store),
    });
  })
);

/**
 * GET /owner/:ownerId - Get all stores by owner
 */
router.get(
  '/owner/:ownerId',
  asyncHandler(async (req, res) => {
    const { ownerId } = req.params;
    const { status } = req.query;

    const filter: any = { ownerId };

    if (status) {
      filter.status = status;
    }

    const stores = await Store.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: stores.map(formatStoreResponse),
      count: stores.length,
    });
  })
);

/**
 * PATCH /:id - Update store details
 */
router.patch(
  '/:id',
  validateRequest(UpdateStoreSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    let store = await Store.findOne({ storeId: id });

    if (!store) {
      store = await Store.findById(id);
    }

    if (!store) {
      res.status(404).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        (store as any)[key] = updateData[key];
      }
    });

    await store.save();

    res.json({
      success: true,
      data: formatStoreResponse(store),
      message: 'Store updated successfully',
    });
  })
);

/**
 * PATCH /:id/status - Update store status only
 */
router.patch(
  '/:id/status',
  validateRequest(UpdateStatusSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    let store = await Store.findOne({ storeId: id });

    if (!store) {
      store = await Store.findById(id);
    }

    if (!store) {
      res.status(404).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    store.status = status;
    await store.save();

    res.json({
      success: true,
      data: formatStoreResponse(store),
      message: `Store status updated to ${status}`,
    });
  })
);

/**
 * DELETE /:id - Delete store
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    let store = await Store.findOne({ storeId: id });

    if (!store) {
      store = await Store.findById(id);
    }

    if (!store) {
      res.status(404).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    await Store.deleteOne({ _id: store._id });

    res.json({
      success: true,
      message: 'Store deleted successfully',
      deletedId: store.storeId,
    });
  })
);

// ============================================
// Export
// ============================================

export default router;
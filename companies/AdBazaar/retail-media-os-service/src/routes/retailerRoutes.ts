import { Router, Request, Response, NextFunction } from 'express';
import { retailerService, inventoryService } from '../services';
import { createRetailerSchema, updateRetailerSchema, createStoreSchema, createInventorySchema } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/retailers - Register retailer
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = createRetailerSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors
      });
      return;
    }

    const retailer = await retailerService.create(validation.data);

    res.status(201).json({
      success: true,
      data: retailer
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/retailers - List retailers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, category, limit, offset } = req.query;

    const result = await retailerService.list({
      status: status as string,
      category: category as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result.retailers,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/retailers/:id - Get retailer
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const retailer = await retailerService.getById(req.params.id);

    if (!retailer) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Retailer not found'
      });
      return;
    }

    res.json({
      success: true,
      data: retailer
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/retailers/:id - Update retailer
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = updateRetailerSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors
      });
      return;
    }

    const retailer = await retailerService.update(req.params.id, validation.data);

    if (!retailer) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Retailer not found'
      });
      return;
    }

    res.json({
      success: true,
      data: retailer
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/retailers/:id - Delete retailer
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await retailerService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Retailer not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Retailer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/retailers/:id/stores - Add store locations
router.post('/:id/stores', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = createStoreSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors
      });
      return;
    }

    const store = await inventoryService.createStore({
      retailerId: req.params.id,
      ...validation.data
    });

    // Update retailer store count
    await retailerService.updateStoreCount(req.params.id, 1);

    res.status(201).json({
      success: true,
      data: store
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/retailers/:id/stores - List stores
router.get('/:id/stores', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, city, storeType, limit, offset } = req.query;

    const result = await inventoryService.listStoresByRetailer(req.params.id, {
      status: status as string,
      city: city as string,
      storeType: storeType as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result.stores,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/retailers/:id/inventory - Retail media inventory
router.post('/:id/inventory', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = createInventorySchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors
      });
      return;
    }

    const inventory = await inventoryService.createInventory({
      retailerId: req.params.id,
      storeId: validation.data.storeId,
      inventoryType: validation.data.inventoryType,
      placement: validation.data.placement,
      dimensions: validation.data.dimensions,
      pricing: validation.data.pricing,
      category: validation.data.category,
      productIds: validation.data.productIds,
      visibility: validation.data.visibility,
      availability: {
        startDate: new Date(validation.data.availability.startDate),
        endDate: new Date(validation.data.availability.endDate)
      }
    });

    res.status(201).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/retailers/:id/inventory - Get inventory
router.get('/:id/inventory', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, inventoryType, status, category, limit, offset } = req.query;

    const result = await inventoryService.listInventoryByRetailer(req.params.id, {
      storeId: storeId as string,
      inventoryType: inventoryType as any,
      status: status as string,
      category: category as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result.inventory,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/retailers/:id/inventory/summary - Get inventory summary
router.get('/:id/inventory/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await inventoryService.getInventorySummary(req.params.id);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

export default router;
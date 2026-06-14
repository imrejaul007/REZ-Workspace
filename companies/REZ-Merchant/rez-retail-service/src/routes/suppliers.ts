import { Router, Request, Response, NextFunction } from 'express';
import { Supplier } from '../models';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/suppliers - List all suppliers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, rating, isActive } = req.query;

    const query: any = {};
    if (city) query['address.city'] = city;
    if (rating) query.rating = { $gte: parseFloat(rating as string) };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const suppliers = await Supplier.find(query).sort({ rating: -1, name: 1 });

    res.json({
      success: true,
      data: suppliers,
      count: suppliers.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/suppliers/:id - Get single supplier
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found',
      });
      return;
    }

    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/suppliers/code/:code - Get by code
router.get('/code/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findOne({ code: req.params.code.toUpperCase() });

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found',
      });
      return;
    }

    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/suppliers - Create supplier
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existingSupplier = await Supplier.findOne({ code: req.body.code?.toUpperCase() });
    if (existingSupplier) {
      res.status(409).json({
        success: false,
        error: 'Supplier with this code already exists',
      });
      return;
    }

    const supplier = new Supplier({
      ...req.body,
      code: req.body.code?.toUpperCase(),
    });
    await supplier.save();

    logger.info('Supplier created', { supplierId: supplier._id, code: supplier.code });

    res.status(201).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found',
      });
      return;
    }

    logger.info('Supplier updated', { supplierId: supplier._id });

    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/suppliers/:id - Deactivate supplier
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found',
      });
      return;
    }

    logger.info('Supplier deactivated', { supplierId: supplier._id });

    res.json({
      success: true,
      message: 'Supplier deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/suppliers/:id/rating - Update supplier rating
router.patch('/:id/rating', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rating } = req.body;

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: { rating } },
      { new: true }
    );

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found',
      });
      return;
    }

    logger.info('Supplier rating updated', { supplierId: supplier._id, rating });

    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
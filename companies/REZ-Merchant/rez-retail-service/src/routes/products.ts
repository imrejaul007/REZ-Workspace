import { Router, Request, Response, NextFunction } from 'express';
import { Product, Store, Category, Supplier } from '../models';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  price: z.number().positive(),
  cost: z.number().min(0),
  mrp: z.number().positive().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  images: z.array(z.string()).optional(),
  attributes: z.record(z.any()).optional(),
  storeIds: z.array(z.string()).optional(),
  supplierId: z.string().optional(),
  reorderLevel: z.number().min(0).optional(),
  reorderQuantity: z.number().min(0).optional(),
});

const updateProductSchema = createProductSchema.partial();

// Middleware to validate request body
const validate = (schema: z.ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
};

// GET /api/products - List all products
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, brand, search, page = '1', limit = '50', isActive } = req.query;

    const query: any = {};

    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('supplierId', 'name code')
        .populate('storeIds', 'name code')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplierId', 'name code phone email')
      .populate('storeIds', 'name code address');

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/sku/:sku - Get by SKU
router.get('/sku/:sku', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findOne({ sku: req.params.sku })
      .populate('supplierId', 'name code phone email')
      .populate('storeIds', 'name code address');

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/products - Create product
router.post('/', validate(createProductSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existingProduct = await Product.findOne({ sku: req.body.sku });
    if (existingProduct) {
      res.status(409).json({
        success: false,
        error: 'Product with this SKU already exists',
      });
      return;
    }

    const product = new Product(req.body);
    await product.save();

    logger.info('Product created', { productId: product._id, sku: product.sku });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', validate(updateProductSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    logger.info('Product updated', { productId: product._id, sku: product.sku });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/products/:id/stock - Update stock level
router.patch('/:id/stock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reorderLevel, reorderQuantity } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { reorderLevel, reorderQuantity } },
      { new: true }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    logger.info('Product stock updated', { productId: product._id });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - Soft delete (deactivate)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    logger.info('Product deactivated', { productId: product._id });

    res.json({
      success: true,
      message: 'Product deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/products/bulk - Bulk create/update
router.post('/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      res.status(400).json({
        success: false,
        error: 'Products must be an array',
      });
      return;
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as { index: number; error: string }[],
    };

    for (let i = 0; i < products.length; i++) {
      try {
        const { sku, ...rest } = products[i];

        const existing = await Product.findOne({ sku });
        if (existing) {
          Object.assign(existing, rest);
          await existing.save();
          results.updated++;
        } else {
          const product = new Product({ sku, ...rest });
          await product.save();
          results.created++;
        }
      } catch (err) {
        results.errors.push({
          index: i,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    logger.info('Bulk operation completed', {
      created: results.created,
      updated: results.updated,
      errors: results.errors.length,
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id/analytics - Product analytics
router.get('/:id/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    // This would connect to POS service for actual sales data
    const analytics = {
      productId: product._id,
      sku: product.sku,
      name: product.name,
      pricing: {
        price: product.price,
        cost: product.cost,
        margin: ((product.price - product.cost) / product.price) * 100,
        mrp: product.mrp || product.price,
      },
      stock: {
        reorderLevel: product.reorderLevel,
        reorderQuantity: product.reorderQuantity,
      },
      // Placeholder for sales analytics from POS service
      sales: {
        totalSold: 0,
        revenue: 0,
        avgDailySales: 0,
      },
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
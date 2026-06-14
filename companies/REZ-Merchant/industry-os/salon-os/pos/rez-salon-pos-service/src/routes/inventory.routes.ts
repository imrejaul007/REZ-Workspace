import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { inventoryService } from '../services/InventoryService';

const router = Router();

// Validation middleware
const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};

/**
 * @route POST /api/inventory
 * @desc Create a new product
 */
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be positive'),
    body('costPrice').optional().isFloat({ min: 0 }),
    body('currentStock').optional().isInt({ min: 0 }),
    body('isService').optional().isBoolean(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const product = await inventoryService.createProduct(req.body);
      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/inventory
 * @desc Get all products with filters
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isString(),
    query('brand').optional().isString(),
    query('isService').optional().isBoolean(),
    query('isActive').optional().isBoolean(),
    query('search').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        category: req.query.category as string,
        brand: req.query.brand as string,
        isService: req.query.isService ? req.query.isService === 'true' : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };

      const result = await inventoryService.getProducts(filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/inventory/report
 * @desc Get comprehensive inventory report
 */
router.get('/report', async (req: Request, res: Response) => {
  try {
    const report = await inventoryService.getInventoryReport();
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/inventory/low-stock
 * @desc Get low stock products
 */
router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const products = await inventoryService.getLowStockProducts();
    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/inventory/categories
 * @desc Get product categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await inventoryService.getCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/inventory/brands
 * @desc Get product brands
 */
router.get('/brands', async (req: Request, res: Response) => {
  try {
    const brands = await inventoryService.getBrands();
    res.json({
      success: true,
      data: brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/inventory/movements
 * @desc Get stock movement history
 */
router.get(
  '/movements',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('productId').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const result = await inventoryService.getStockMovements(
        req.query.productId as string,
        req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 50
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/inventory/:productId
 * @desc Get product by ID
 */
router.get(
  '/:productId',
  [param('productId').notEmpty().withMessage('Product ID is required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const product = await inventoryService.getProduct(req.params.productId);
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
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/inventory/lookup/:identifier
 * @desc Get product by SKU or barcode
 */
router.get(
  '/lookup/:identifier',
  [param('identifier').notEmpty().withMessage('SKU or barcode is required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const product = await inventoryService.getProductBySkuOrBarcode(req.params.identifier);
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
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route PUT /api/inventory/:productId
 * @desc Update product
 */
router.put(
  '/:productId',
  [param('productId').notEmpty().withMessage('Product ID is required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const product = await inventoryService.updateProduct(req.params.productId, req.body);
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
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route PATCH /api/inventory/:productId/stock
 * @desc Adjust stock
 */
router.patch(
  '/:productId/stock',
  [
    param('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').isInt().withMessage('Quantity is required'),
    body('reason').notEmpty().withMessage('Reason is required'),
    body('adjustedBy').notEmpty().withMessage('Adjusted by is required'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const product = await inventoryService.adjustStock({
        productId: req.params.productId,
        quantity: req.body.quantity,
        reason: req.body.reason,
        reference: req.body.reference,
        adjustedBy: req.body.adjustedBy,
      });
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
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route PATCH /api/inventory/:productId/toggle
 * @desc Toggle product active status
 */
router.patch(
  '/:productId/toggle',
  [param('productId').notEmpty().withMessage('Product ID is required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const product = await inventoryService.toggleProductStatus(req.params.productId);
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
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route POST /api/inventory/bulk-stock
 * @desc Bulk update stock
 */
router.post(
  '/bulk-stock',
  [
    body('updates').isArray({ min: 1 }).withMessage('Updates array is required'),
    body('updates.*.productId').notEmpty().withMessage('Product ID is required'),
    body('updates.*.newQuantity').isInt({ min: 0 }).withMessage('New quantity must be non-negative'),
    body('updatedBy').notEmpty().withMessage('Updated by is required'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const result = await inventoryService.bulkStockUpdate(req.body.updates, req.body.updatedBy);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route DELETE /api/inventory/:productId
 * @desc Delete product (soft delete)
 */
router.delete(
  '/:productId',
  [param('productId').notEmpty().withMessage('Product ID is required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const deleted = await inventoryService.deleteProduct(req.params.productId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }
      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { productService, creatorService } from '../services';
import { logger } from '../services/logger.service';
import { ProductStatus } from '../types';

const router = Router();

// Validation schemas
const createProductSchema = z.object({
  creatorId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  commission: z.number().min(0).max(100),
  inventory: z.number().int().min(0).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().positive().optional(),
  commission: z.number().min(0).max(100).optional(),
  inventory: z.number().int().min(0).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'sold_out']).optional(),
});

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// ============================================
// PRODUCT ROUTES (Nested under creators)
// ============================================

/**
 * GET /api/creators/:creatorId/products
 * List products for a creator
 */
router.get('/creators/:creatorId/products', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as ProductStatus | undefined;
  const category = req.query.category as string | undefined;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const result = await productService.getByCreator(creatorId, {
    page,
    limit,
    status,
    category,
  });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * POST /api/creators/:creatorId/products
 * Create a product for a creator
 */
router.post('/creators/:creatorId/products', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;
  const validatedData = createProductSchema.parse(req.body);

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Ensure creatorId matches
  validatedData.creatorId = creatorId;

  const product = await productService.create(validatedData);

  logger.info(`Product created via API: ${product._id} for creator: ${creatorId}`);

  res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully',
    timestamp: new Date().toISOString(),
  });
}));

// ============================================
// PRODUCT ROUTES (Direct)
// ============================================

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get('/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await productService.getById(id);
  if (!product) {
    res.status(404).json({
      success: false,
      error: 'Product not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: product,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * PUT /api/products/:id
 * Update product
 */
router.put('/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateProductSchema.parse(req.body);

  const product = await productService.update(id, validatedData);
  if (!product) {
    res.status(404).json({
      success: false,
      error: 'Product not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info(`Product updated via API: ${id}`);

  res.json({
    success: true,
    data: product,
    message: 'Product updated successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * DELETE /api/products/:id
 * Delete product
 */
router.delete('/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await productService.delete(id);
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Product not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info(`Product deleted via API: ${id}`);

  res.json({
    success: true,
    message: 'Product deleted successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * PATCH /api/products/:id/inventory
 * Update product inventory
 */
router.patch('/products/:id/inventory', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (typeof quantity !== 'number') {
    res.status(400).json({
      success: false,
      error: 'Quantity must be a number',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const product = await productService.updateInventory(id, quantity);
  if (!product) {
    res.status(404).json({
      success: false,
      error: 'Product not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info(`Product inventory updated: ${id}, quantity: ${quantity}`);

  res.json({
    success: true,
    data: product,
    message: 'Inventory updated successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * PATCH /api/products/:id/status
 * Update product status
 */
router.patch('/products/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!Object.values(ProductStatus).includes(status)) {
    res.status(400).json({
      success: false,
      error: 'Invalid status',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const product = await productService.updateStatus(id, status);
  if (!product) {
    res.status(404).json({
      success: false,
      error: 'Product not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info(`Product status updated: ${id}, status: ${status}`);

  res.json({
    success: true,
    data: product,
    message: 'Status updated successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/products/featured
 * Get featured products
 */
router.get('/products/featured', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;

  const products = await productService.getFeatured(limit);

  res.json({
    success: true,
    data: products,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/products/category/:category
 * Get products by category
 */
router.get('/products/category/:category', asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;

  const products = await productService.getByCategory(category, limit);

  res.json({
    success: true,
    data: products,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/products/search
 * Search products
 */
router.get('/products/search', asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const category = req.query.category as string | undefined;
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

  if (!query) {
    res.status(400).json({
      success: false,
      error: 'Search query is required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const result = await productService.search(query, {
    page,
    limit,
    category,
    minPrice,
    maxPrice,
  });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
}));

export default router;
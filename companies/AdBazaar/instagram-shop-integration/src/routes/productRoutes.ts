import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { productService } from '../services';
import { authMiddleware, validateBody } from '../middleware';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  price: z.number().positive(),
  currency: z.string().optional().default('INR'),
  images: z.array(z.string().url()).min(1).max(20),
  availability: z.enum(['in_stock', 'out_of_stock', 'preorder']).optional().default('in_stock'),
  category: z.string().min(1),
  syncToInstagram: z.boolean().optional().default(false),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  description: z.string().min(1).max(2000).optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  images: z.array(z.string().url()).min(1).max(20).optional(),
  availability: z.enum(['in_stock', 'out_of_stock', 'preorder']).optional(),
  category: z.string().min(1).optional(),
});

/**
 * POST /api/products
 * Create a new product
 */
router.post(
  '/',
  authMiddleware,
  validateBody(createProductSchema),
  async (req: Request, res: Response) => {
    try {
      const product = await productService.createProduct(
        {
          name: req.body.name,
          description: req.body.description,
          price: req.body.price,
          currency: req.body.currency,
          images: req.body.images,
          availability: req.body.availability,
          category: req.body.category,
        },
        req.body.syncToInstagram
      );

      res.status(201).json({
        success: true,
        data: product,
        message: req.body.syncToInstagram
          ? 'Product created and synced to Instagram'
          : 'Product created successfully',
      });
    } catch (error) {
      logger.error('Failed to create product', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
      });
    }
  }
);

/**
 * GET /api/products
 * List products with filtering and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, availability, syncStatus, page, limit, search } = req.query;

    const result = await productService.listProducts({
      category: category as string,
      availability: availability as string,
      syncStatus: syncStatus as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
    });

    res.json({
      success: true,
      data: result.products,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Failed to list products', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'Failed to list products',
    });
  }
});

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await productService.getProduct(req.params.id);

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
    logger.error('Failed to get product', {
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get product',
    });
  }
});

/**
 * PATCH /api/products/:id
 * Update product
 */
router.patch(
  '/:id',
  authMiddleware,
  validateBody(updateProductSchema),
  async (req: Request, res: Response) => {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);

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
        message: 'Product updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update product', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId: req.params.id,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to update product',
      });
    }
  }
);

/**
 * DELETE /api/products/:id
 * Delete product from local database
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);

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
    logger.error('Failed to delete product', {
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
    });
  }
});

/**
 * POST /api/products/sync
 * Sync product to Instagram
 */
router.post('/sync', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({
        success: false,
        error: 'Product ID is required',
      });
      return;
    }

    const product = await productService.syncToInstagram(productId);

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
      message: 'Product synced to Instagram successfully',
    });
  } catch (error) {
    logger.error('Failed to sync product to Instagram', {
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: req.body.productId,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to sync product to Instagram',
      details: error instanceof Error ? error.message : undefined,
    });
  }
});

/**
 * POST /api/products/:id/sync
 * Sync specific product to Instagram
 */
router.post('/:id/sync', authMiddleware, async (req: Request, res: Response) => {
  try {
    const product = await productService.syncToInstagram(req.params.id);

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
      message: 'Product synced to Instagram successfully',
    });
  } catch (error) {
    logger.error('Failed to sync product to Instagram', {
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to sync product to Instagram',
    });
  }
});

/**
 * DELETE /api/products/:id/instagram
 * Remove product from Instagram catalog
 */
router.delete('/:id/instagram', authMiddleware, async (req: Request, res: Response) => {
  try {
    const product = await productService.getProduct(req.params.id);

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    if (!product.instagramProductId) {
      res.status(400).json({
        success: false,
        error: 'Product is not synced to Instagram',
      });
      return;
    }

    // Delete from Instagram
    const { instagramApiService } = await import('../services');
    await instagramApiService.deleteCatalogProduct(product.instagramProductId);

    // Update local record
    product.instagramProductId = undefined;
    product.syncStatus = 'pending';
    product.syncedAt = undefined;
    await product.save();

    res.json({
      success: true,
      message: 'Product removed from Instagram',
    });
  } catch (error) {
    logger.error('Failed to remove product from Instagram', {
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to remove product from Instagram',
    });
  }
});

/**
 * GET /api/products/:id/tags
 * Get tagging suggestions for a product
 */
router.get('/:id/tags', async (req: Request, res: Response) => {
  try {
    const suggestions = await productService.getTaggingSuggestions(req.params.id);

    res.json({
      success: true,
      data: {
        productId: req.params.id,
        suggestions,
      },
    });
  } catch (error) {
    logger.error('Failed to get tagging suggestions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get tagging suggestions',
    });
  }
});

/**
 * PATCH /api/products/:id/availability
 * Update product availability
 */
router.patch(
  '/:id/availability',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { availability } = req.body;

      if (!['in_stock', 'out_of_stock', 'preorder'].includes(availability)) {
        res.status(400).json({
          success: false,
          error: 'Invalid availability value',
        });
        return;
      }

      const product = await productService.updateAvailability(
        req.params.id,
        availability as 'in_stock' | 'out_of_stock' | 'preorder'
      );

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
        message: 'Product availability updated',
      });
    } catch (error) {
      logger.error('Failed to update product availability', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId: req.params.id,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to update product availability',
      });
    }
  }
);

export default router;
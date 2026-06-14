import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { productService } from '../services/product.service';
import { ProductSchema, ProductVariantSchema } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const updateProductSchema = createProductSchema.partial();

const variantSchema = ProductVariantSchema.omit({ id: true });

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  tags: z.string().optional().transform(val => val?.split(',').filter(Boolean)),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
});

/**
 * GET /api/products
 * List all products with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    const filter = {
      search: query.search,
      categoryId: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      tags: query.tags,
      isActive: query.isActive,
      isFeatured: query.isFeatured,
      inStock: query.inStock,
    };

    const result = await productService.listProducts(filter, query.page, query.limit);

    res.json({
      success: true,
      data: result.products,
      pagination: {
        page: result.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    logger.error('Error listing products:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/products/featured
 * Get featured products
 */
router.get('/featured', async (_req: Request, res: Response) => {
  try {
    const products = await productService.getFeaturedProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    logger.error('Error fetching featured products:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/products/sku/:sku
 * Get product by SKU
 */
router.get('/sku/:sku', async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductBySku(req.params.sku);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Error fetching product by SKU:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/products
 * Create a new product
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createProductSchema.parse(req.body);
    const product = await productService.createProduct(validated);

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    logger.error('Error creating product:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * PUT /api/products/:id
 * Update a product
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validated = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(req.params.id, validated);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Error updating product:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * DELETE /api/products/:id
 * Delete a product (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/products/:id/variants
 * Add a variant to product
 */
router.post('/:id/variants', async (req: Request, res: Response) => {
  try {
    const validated = variantSchema.parse(req.body);
    const product = await productService.addVariant(req.params.id, validated);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    logger.error('Error adding variant:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * PUT /api/products/:id/variants/:variantId
 * Update a variant
 */
router.put('/:id/variants/:variantId', async (req: Request, res: Response) => {
  try {
    const validated = variantSchema.partial().parse(req.body);
    const product = await productService.updateVariant(req.params.id, req.params.variantId, validated);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product or variant not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Error updating variant:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * DELETE /api/products/:id/variants/:variantId
 * Delete a variant
 */
router.delete('/:id/variants/:variantId', async (req: Request, res: Response) => {
  try {
    const product = await productService.deleteVariant(req.params.id, req.params.variantId);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product or variant not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Error deleting variant:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/products/:id/inventory
 * Update product inventory
 */
router.put('/:id/inventory', async (req: Request, res: Response) => {
  try {
    const { quantity } = z.object({ quantity: z.number().int().min(0) }).parse(req.body);
    const product = await productService.updateInventory(req.params.id, quantity);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Error updating inventory:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { productService } from '../services/productService.js';
import { GoStore } from '../models/GoStore.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const searchSchema = z.object({
  query: z.string().optional(),
  storeId: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
});

/**
 * GET /api/stores/:storeId
 * Get store info
 */
router.get('/:storeId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    const store = await GoStore.findOne({ storeId });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({
      success: true,
      store: {
        storeId: store.storeId,
        name: store.name,
        logo: store.logo,
        banner: store.banner,
        address: store.address,
        storeType: store.storeType,
        goEnabled: store.goEnabled,
        taxRate: store.taxRate,
        cashback: {
          enabled: store.cashback.enabled,
          defaultPercent: store.cashback.defaultPercent,
        },
        settings: store.settings,
      },
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to get store' });
  }
});

/**
 * GET /api/stores/:storeId/products
 * Get store products
 */
router.get('/:storeId/products', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { page, limit, category, brand } = req.query;

    const result = await productService.getByStore(
      storeId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 50
    );

    // Filter by category/brand if provided
    let products = result.products;
    if (category) {
      products = products.filter((p) => p.category === category);
    }
    if (brand) {
      products = products.filter((p) => p.brand === brand);
    }

    res.json({
      success: true,
      products,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

/**
 * GET /api/stores/:storeId/categories
 * Get store categories
 */
router.get('/:storeId/categories', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    const categories = await productService.getCategories(storeId);

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

/**
 * GET /api/stores/:storeId/brands
 * Get store brands
 */
router.get('/:storeId/brands', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    const brands = await productService.getBrands(storeId);

    res.json({
      success: true,
      brands,
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Failed to get brands' });
  }
});

/**
 * GET /api/products/search
 * Search products
 */
router.get('/products/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validated = searchSchema.parse(req.query);
    const result = await productService.searchProducts(validated);

    res.json({
      success: true,
      products: result.products,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

/**
 * GET /api/products/barcode/:barcode
 * Get product by barcode
 */
router.get('/products/barcode/:barcode', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const storeId = req.query.storeId as string;

    const product = await productService.getByBarcode(barcode, storeId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

export default router;

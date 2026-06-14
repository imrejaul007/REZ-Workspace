/**
 * Salon Inventory Routes
 *
 * REST API endpoints for salon product inventory management
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import {
  SalonInventoryService,
  getSalonInventoryService,
  ProductInput,
} from '../services/salonInventoryService';
import { salonInventoryProductSchema, validateBody } from '../utils/validation';

const router = Router();

// Apply authentication to all routes
router.use(merchantAuth);

// Initialize service
const service: SalonInventoryService = getSalonInventoryService();

/**
 * POST /api/salon-inventory
 * Add a new product to inventory
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const validation = validateBody(salonInventoryProductSchema)(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const input: ProductInput = {
      storeId: validation.data.storeId,
      name: validation.data.name,
      brand: validation.data.brand,
      category: validation.data.category,
      quantity: validation.data.quantity,
      unit: validation.data.unit,
      reorderPoint: validation.data.reorderPoint,
      cost: validation.data.cost,
      price: validation.data.price,
      supplier: validation.data.supplier,
      expiryDate: validation.data.expiryDate ? new Date(validation.data.expiryDate) : undefined,
    };

    const product = await service.addProduct(input);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add product',
    });
  }
});

/**
 * GET /api/salon-inventory/:storeId
 * Get all products for a store
 */
router.get('/:storeId', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { storeId } = req.params;
    const { category } = req.query;

    let products;
    if (category && typeof category === 'string') {
      products = await service.getProductsByCategory(storeId, category as unknown);
    } else {
      products = await service.getProducts(storeId);
    }

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch products',
    });
  }
});

/**
 * GET /api/salon-inventory/:storeId/summary
 * Get inventory summary for a store
 */
router.get('/:storeId/summary', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { storeId } = req.params;
    const summary = await service.getInventorySummary(storeId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch inventory summary',
    });
  }
});

/**
 * GET /api/salon-inventory/:storeId/product/:productId
 * Get a single product
 */
router.get('/:storeId/product/:productId', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { productId } = req.params;
    const product = await service.getProduct(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch product',
    });
  }
});

/**
 * PUT /api/salon-inventory/:id/stock
 * Update stock quantity
 */
router.put('/:id/stock', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity: must be a non-negative number',
      });
    }

    await service.updateStock(id, quantity);

    res.json({
      success: true,
      message: 'Stock updated successfully',
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update stock',
    });
  }
});

/**
 * PUT /api/salon-inventory/:id/restock
 * Add stock to existing quantity
 */
router.put('/:id/restock', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity: must be a positive number',
      });
    }

    await service.addStock(id, quantity);

    res.json({
      success: true,
      message: 'Stock added successfully',
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add stock',
    });
  }
});

/**
 * GET /api/salon-inventory/:storeId/low-stock
 * Get low-stock products
 */
router.get('/:storeId/low-stock', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { storeId } = req.params;
    const products = await service.getLowStock(storeId);

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch low-stock products',
    });
  }
});

/**
 * GET /api/salon-inventory/:storeId/expiring
 * Get products expiring soon
 */
router.get('/:storeId/expiring', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { storeId } = req.params;
    const daysAhead = parseInt(req.query.days as string) || 30;

    const products = await service.getExpiryAlerts(storeId, daysAhead);

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch expiring products',
    });
  }
});

/**
 * GET /api/salon-inventory/:storeId/expired
 * Get expired products
 */
router.get('/:storeId/expired', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { storeId } = req.params;
    const products = await service.getExpiredProducts(storeId);

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch expired products',
    });
  }
});

/**
 * POST /api/salon-inventory/:id/usage
 * Record product usage
 */
router.post('/:id/usage', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { quantity, staffId } = req.body;

    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity: must be a positive number',
      });
    }

    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: 'staffId is required',
      });
    }

    await service.recordUsage(id, quantity, staffId);

    res.json({
      success: true,
      message: 'Usage recorded successfully',
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record usage',
    });
  }
});

/**
 * PUT /api/salon-inventory/:id
 * Update product details
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Remove fields that should not be updated directly
    delete updates._id;
    delete updates.storeId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const product = await service.updateProduct(id, updates);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update product',
    });
  }
});

/**
 * DELETE /api/salon-inventory/:id
 * Delete a product
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const deleted = await service.deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete product',
    });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Product, InventoryAlert, AlertType, AlertSeverity, ProductStatus } from '../models';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';
import { trackGroceryOrderEvent, sendLowStockWhatsApp } from '../integrations/rabtul';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation Schemas
const resolveAlertSchema = z.object({
  resolvedBy: z.string().min(1, 'Resolver name is required'),
  notes: z.string().optional()
});

const stockAdjustSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int(),
  reason: z.enum(['PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'EXPIRY', 'ADJUSTMENT', 'RECEIVED', 'INVENTORY_COUNT']),
  notes: z.string().optional()
});

const batchStockAdjustSchema = z.object({
  adjustments: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int(),
    reason: z.enum(['PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'EXPIRY', 'ADJUSTMENT', 'RECEIVED', 'INVENTORY_COUNT'])
  }))
});

/**
 * GET /api/inventory/alerts - Get active inventory alerts
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;
    const type = req.query.type as AlertType | undefined;
    const severity = req.query.severity as AlertSeverity | undefined;
    const unresolvedOnly = req.query.unresolvedOnly !== 'false';

    const filter: Record<string, unknown> = {};

    if (merchantId) {
      filter.merchantId = merchantId;
    }

    if (type) {
      filter.type = type;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (unresolvedOnly) {
      filter.isResolved = false;
    }

    const alerts = await InventoryAlert.find(filter)
      .sort({ severity: -1, createdAt: -1 })
      .limit(100);

    // Group alerts by type
    const alertsByType = alerts.reduce((acc, alert) => {
      if (!acc[alert.type]) {
        acc[alert.type] = [];
      }
      acc[alert.type].push(alert);
      return acc;
    }, {} as Record<string, typeof alerts>);

    res.json({
      success: true,
      data: {
        alerts,
        alertsByType,
        total: alerts.length,
        unresolved: alerts.filter(a => !a.isResolved).length
      }
    });
  } catch (error) {
    logger.error('Error getting inventory alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/inventory/alerts/:id - Get specific alert
 */
router.get('/alerts/:id', async (req: Request, res: Response) => {
  try {
    const alert = await InventoryAlert.findOne({ alertId: req.params.id });

    if (!alert) {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
      return;
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Error getting alert:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/inventory/alerts/:id/resolve - Resolve an alert
 */
router.put('/alerts/:id/resolve', async (req: Request, res: Response) => {
  try {
    const validatedData = resolveAlertSchema.parse(req.body);

    const alert = await InventoryAlert.findOneAndUpdate(
      { alertId: req.params.id },
      {
        $set: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: validatedData.resolvedBy,
          resolutionNotes: validatedData.notes
        }
      },
      { new: true }
    );

    if (!alert) {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
      return;
    }

    logger.info(`Alert resolved: ${req.params.id} by ${validatedData.resolvedBy}`);

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: alert
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      logger.error('Error resolving alert:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * POST /api/inventory/alerts/resolve-all - Resolve all alerts for a merchant
 */
router.post('/alerts/resolve-all', async (req: Request, res: Response) => {
  try {
    const { merchantId, type, resolvedBy } = req.body;

    if (!merchantId || !resolvedBy) {
      res.status(400).json({
        success: false,
        error: 'merchantId and resolvedBy are required'
      });
      return;
    }

    const filter: Record<string, unknown> = {
      merchantId,
      isResolved: false
    };

    if (type) {
      filter.type = type;
    }

    const result = await InventoryAlert.updateMany(
      filter,
      {
        $set: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy
        }
      }
    );

    logger.info(`Resolved ${result.modifiedCount} alerts for merchant ${merchantId}`);

    res.json({
      success: true,
      message: `Resolved ${result.modifiedCount} alerts`,
      data: {
        resolvedCount: result.modifiedCount
      }
    });
  } catch (error) {
    logger.error('Error resolving all alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/inventory/low-stock - Get products below reorder level
 */
router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;
    const includeOutOfStock = req.query.includeOutOfStock !== 'false';

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'merchantId is required'
      });
      return;
    }

    const filter: Record<string, unknown> = {
      merchantId,
      status: ProductStatus.ACTIVE
    };

    // Find products where stock <= reorder level
    const products = await Product.find({
      ...filter,
      $expr: { $lte: ['$stock', '$reorderLevel'] }
    }).sort({ stock: 1 });

    // Track low stock events via RABTUL SDK
    if (products.length > 0) {
      try {
        await trackGroceryOrderEvent({
          customerId: merchantId,
          merchantId,
          orderId: `LOW_STOCK_ALERT_${Date.now()}`,
          products: products.map(p => ({
            productId: p.productId,
            productName: p.name,
            quantity: p.stock,
            price: p.costPrice,
            category: p.category,
          })),
          totalAmount: products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0),
          currency: 'INR',
          action: 'created',
          metadata: { type: 'low_stock_review' },
        });
      } catch (trackError) {
        logger.warn('Failed to track low stock event', { error: trackError });
      }
    }

    // Separate critical (out of stock) from low stock
    const critical = products.filter(p => p.stock === 0);
    const lowStock = products.filter(p => p.stock > 0);

    res.json({
      success: true,
      data: {
        critical,
        lowStock,
        totalCritical: critical.length,
        totalLowStock: lowStock.length,
        summary: {
          criticalProducts: critical.map(p => ({
            productId: p.productId,
            name: p.name,
            currentStock: p.stock,
            reorderLevel: p.reorderLevel
          })),
          lowStockProducts: lowStock.map(p => ({
            productId: p.productId,
            name: p.name,
            currentStock: p.stock,
            reorderLevel: p.reorderLevel,
            stockPercentage: Math.round((p.stock / p.reorderLevel) * 100)
          }))
        }
      }
    });
  } catch (error) {
    logger.error('Error getting low stock products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/inventory/expiring - Get products expiring within N days
 */
router.get('/expiring', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;
    const days = parseInt(req.query.days as string) || 30;
    const includeExpired = req.query.includeExpired === 'true';

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'merchantId is required'
      });
      return;
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const filter: Record<string, unknown> = {
      merchantId,
      expiryDate: { $exists: true, $ne: null }
    };

    if (includeExpired) {
      filter.expiryDate = { $lte: futureDate };
    } else {
      filter.expiryDate = { $gt: now, $lte: futureDate };
    }

    const products = await Product.find(filter)
      .sort({ expiryDate: 1 })
      .select('productId name category barcode expiryDate stock reorderLevel supplierId');

    // Track expiry events via RABTUL SDK
    if (products.length > 0) {
      try {
        await trackGroceryOrderEvent({
          customerId: merchantId,
          merchantId,
          orderId: `EXPIRY_ALERT_${Date.now()}`,
          products: products.map(p => ({
            productId: p.productId,
            productName: p.name,
            quantity: p.stock,
            price: p.costPrice,
            category: p.category,
          })),
          totalAmount: products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0),
          currency: 'INR',
          action: 'created',
          metadata: { type: 'expiry_alert' },
        });
      } catch (trackError) {
        logger.warn('Failed to track expiry event', { error: trackError });
      }
    }

    // Group by urgency
    const critical = products.filter(p => {
      const daysUntil = Math.ceil((p.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3;
    });

    const urgent = products.filter(p => {
      const daysUntil = Math.ceil((p.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 3 && daysUntil <= 7;
    });

    const soon = products.filter(p => {
      const daysUntil = Math.ceil((p.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 7 && daysUntil <= 14;
    });

    const approaching = products.filter(p => {
      const daysUntil = Math.ceil((p.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 14;
    });

    const expired = includeExpired ? products.filter(p => p.expiryDate! < now) : [];

    res.json({
      success: true,
      data: {
        products,
        grouped: {
          expired: expired.map(p => ({
            ...p.toObject(),
            daysUntilExpiry: Math.ceil((now.getTime() - p.expiryDate!.getTime()) / (1000 * 60 * 60 * 24))
          })),
          critical: critical.map(p => ({
            ...p.toObject(),
            daysUntilExpiry: Math.ceil((p.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          })),
          urgent: urgent.map(p => ({
            ...p.toObject(),
            daysUntilExpiry: Math.ceil((p.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          })),
          soon: soon.map(p => ({
            ...p.toObject(),
            daysUntilExpiry: Math.ceil((p.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          })),
          approaching: approaching.map(p => ({
            ...p.toObject(),
            daysUntilExpiry: Math.ceil((p.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          }))
        },
        summary: {
          expired: expired.length,
          critical: critical.length,
          urgent: urgent.length,
          soon: soon.length,
          approaching: approaching.length,
          total: products.length
        }
      }
    });
  } catch (error) {
    logger.error('Error getting expiring products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/inventory/expired - Get expired products
 */
router.get('/expired', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'merchantId is required'
      });
      return;
    }

    const now = new Date();

    const products = await Product.find({
      merchantId,
      expiryDate: { $lte: now },
      stock: { $gt: 0 }
    }).sort({ expiryDate: 1 });

    // Calculate total value of expired stock
    const totalExpiredValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);

    res.json({
      success: true,
      data: {
        products: products.map(p => ({
          ...p.toObject(),
          daysExpired: Math.ceil((now.getTime() - p.expiryDate!.getTime()) / (1000 * 60 * 60 * 24)),
          expiredStockValue: p.costPrice * p.stock
        })),
        summary: {
          count: products.length,
          totalStock: products.reduce((sum, p) => sum + p.stock, 0),
          totalExpiredValue
        }
      }
    });
  } catch (error) {
    logger.error('Error getting expired products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/inventory/stock-adjust - Adjust stock quantity
 */
router.post('/stock-adjust', async (req: Request, res: Response) => {
  try {
    const validatedData = stockAdjustSchema.parse(req.body);

    const product = await Product.findOne({ productId: validatedData.productId });

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    let newStock: number;
    const previousStock = product.stock;

    switch (validatedData.reason) {
      case 'PURCHASE':
      case 'RECEIVED':
        newStock = product.stock + Math.abs(validatedData.quantity);
        break;
      case 'RETURN':
        newStock = product.stock + Math.abs(validatedData.quantity);
        break;
      case 'SALE':
        newStock = product.stock - Math.abs(validatedData.quantity);
        if (newStock < 0) {
          res.status(400).json({
            success: false,
            error: 'Insufficient stock',
            availableStock: product.stock,
            requestedQuantity: Math.abs(validatedData.quantity)
          });
          return;
        }
        break;
      case 'DAMAGE':
      case 'EXPIRY':
      case 'ADJUSTMENT':
      case 'INVENTORY_COUNT':
        newStock = product.stock + validatedData.quantity;
        if (newStock < 0) {
          res.status(400).json({
            success: false,
            error: 'Adjustment would result in negative stock',
            currentStock: product.stock,
            adjustment: validatedData.quantity
          });
          return;
        }
        break;
      default:
        newStock = product.stock;
    }

    product.stock = Math.max(0, newStock);
    await product.save();

    logger.info(`Stock adjusted: ${product.productId} - ${previousStock} -> ${product.stock} (${validatedData.reason})`);

    res.json({
      success: true,
      data: {
        productId: product.productId,
        name: product.name,
        previousStock,
        newStock: product.stock,
        adjustment: product.stock - previousStock,
        reason: validatedData.reason,
        notes: validatedData.notes
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      logger.error('Error adjusting stock:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * POST /api/inventory/stock-adjust/batch - Batch stock adjustment
 */
router.post('/stock-adjust/batch', async (req: Request, res: Response) => {
  try {
    const { adjustments, notes } = req.body;

    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Adjustments array is required'
      });
      return;
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { productId: string; error: string }[],
      adjustments: [] as {
        productId: string;
        name: string;
        previousStock: number;
        newStock: number;
      }[]
    };

    for (const adjustment of adjustments) {
      try {
        const validated = stockAdjustSchema.parse(adjustment);

        const product = await Product.findOne({ productId: validated.productId });

        if (!product) {
          results.failed++;
          results.errors.push({
            productId: validated.productId,
            error: 'Product not found'
          });
          continue;
        }

        const previousStock = product.stock;
        let newStock: number;

        switch (validated.reason) {
          case 'PURCHASE':
          case 'RECEIVED':
          case 'RETURN':
            newStock = product.stock + Math.abs(validated.quantity);
            break;
          case 'SALE':
            newStock = product.stock - Math.abs(validated.quantity);
            if (newStock < 0) {
              results.failed++;
              results.errors.push({
                productId: validated.productId,
                error: `Insufficient stock: ${product.stock}`
              });
              continue;
            }
            break;
          default:
            newStock = product.stock + validated.quantity;
            if (newStock < 0) {
              results.failed++;
              results.errors.push({
                productId: validated.productId,
                error: 'Adjustment would result in negative stock'
              });
              continue;
            }
        }

        product.stock = Math.max(0, newStock);
        await product.save();

        results.success++;
        results.adjustments.push({
          productId: product.productId,
          name: product.name,
          previousStock,
          newStock: product.stock
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          productId: adjustment.productId || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info(`Batch stock adjustment: ${results.success} success, ${results.failed} failed`);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error in batch stock adjustment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/inventory/valuation - Get inventory valuation
 */
router.get('/valuation', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'merchantId is required'
      });
      return;
    }

    const products = await Product.find({ merchantId });

    const valuation = products.reduce((acc, product) => {
      const costValue = product.costPrice * product.stock;
      const retailValue = product.sellingPrice * product.stock;

      return {
        totalCostValue: acc.totalCostValue + costValue,
        totalRetailValue: acc.totalRetailValue + retailValue,
        totalItems: acc.totalItems + product.stock,
        totalProducts: acc.totalProducts + 1
      };
    }, { totalCostValue: 0, totalRetailValue: 0, totalItems: 0, totalProducts: 0 });

    // Get category breakdown
    const categoryBreakdown = await Product.aggregate([
      { $match: { merchantId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          costValue: { $sum: { $multiply: ['$costPrice', '$stock'] } },
          retailValue: { $sum: { $multiply: ['$sellingPrice', '$stock'] } }
        }
      },
      { $sort: { costValue: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        ...valuation,
        potentialProfit: valuation.totalRetailValue - valuation.totalCostValue,
        categoryBreakdown: categoryBreakdown.map(c => ({
          category: c._id,
          productCount: c.count,
          totalStock: c.totalStock,
          costValue: c.costValue,
          retailValue: c.retailValue
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting inventory valuation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
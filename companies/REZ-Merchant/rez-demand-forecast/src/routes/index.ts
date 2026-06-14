import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { forecastEngine } from '../services/ForecastEngine';
import { Product, SalesHistory, Forecast, Alert, Supplier } from '../models/Forecast';
import { logger } from '../config/logger';

const router = Router();

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  currentStock: z.number().min(0).optional(),
  leadTime: z.number().min(1).optional(),
  safetyStock: z.number().min(0).optional(),
  reorderPoint: z.number().min(0),
  maxStock: z.number().min(0).optional(),
  unitCost: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  supplierId: z.string().optional(),
  seasonality: z.enum(['high', 'medium', 'low']).optional(),
});

const recordSalesSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(0),
  revenue: z.number().min(0).optional(),
  date: z.string().datetime().optional(),
  region: z.string().optional(),
  storeId: z.string().optional(),
});

// ==================== PRODUCT ROUTES ====================

// Get all products
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { category, lowStock, search } = req.query;
    const query: Record<string, any> = { isActive: true };

    if (category) query.category = category;
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$safetyStock'] };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('supplierId', 'name email')
      .sort({ name: 1 });

    res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch products' } });
  }
});

// Get product by ID
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplierId', 'name email phone');

    if (!product) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch product' } });
  }
});

// Create product
router.post('/products', async (req: Request, res: Response) => {
  try {
    const validatedData = createProductSchema.parse(req.body);
    const product = await Product.create(validatedData);

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Validation error', details: error.errors } });
    }
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Update product
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Delete product (soft delete)
router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }

    res.json({ success: true, message: 'Product deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// ==================== SALES ROUTES ====================

// Record sales
router.post('/sales', async (req: Request, res: Response) => {
  try {
    const validatedData = recordSalesSchema.parse(req.body);

    const sales = await SalesHistory.create({
      ...validatedData,
      date: validatedData.date ? new Date(validatedData.date) : new Date(),
    });

    // Update product stock
    await Product.findByIdAndUpdate(validatedData.productId, {
      $inc: { currentStock: -validatedData.quantity },
    });

    res.status(201).json({ success: true, data: sales });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Validation error', details: error.errors } });
    }
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Bulk record sales
router.post('/sales/bulk', async (req: Request, res: Response) => {
  try {
    const salesData = req.body.sales as Array<{
      productId: string;
      quantity: number;
      revenue?: number;
      date?: string;
      region?: string;
      storeId?: string;
    }>;

    if (!Array.isArray(salesData)) {
      return res.status(400).json({ success: false, error: { message: 'Sales must be an array' } });
    }

    const sales = await Promise.all(
      salesData.map(async (s) => {
        const sale = await SalesHistory.create({
          ...s,
          date: s.date ? new Date(s.date) : new Date(),
        });

        await Product.findByIdAndUpdate(s.productId, {
          $inc: { currentStock: -s.quantity },
        });

        return sale;
      })
    );

    res.status(201).json({ success: true, data: sales, count: sales.length });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Get sales history
router.get('/sales/:productId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, region, storeId } = req.query;
    const query: Record<string, any> = { productId: req.params.productId };

    if (startDate) {
      query.date = { $gte: new Date(startDate as string) };
    }
    if (endDate) {
      query.date = { ...query.date, $lte: new Date(endDate as string) };
    }
    if (region) query.region = region;
    if (storeId) query.storeId = storeId;

    const sales = await SalesHistory.find(query)
      .sort({ date: -1 })
      .limit(100);

    res.json({ success: true, data: sales, count: sales.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch sales' } });
  }
});

// ==================== FORECAST ROUTES ====================

// Get forecast for a product
router.get('/forecast/:productId', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const forecastDays = days ? parseInt(days as string) : 30;

    const result = await forecastEngine.generateForecast(req.params.productId, forecastDays);

    // Save forecast to database
    const forecast = await Forecast.create({
      productId: req.params.productId,
      forecastDate: result.forecastDate,
      periods: result.periods,
      confidence: result.confidence,
      trend: result.trend,
      seasonality: result.seasonality,
      model: result.model,
      accuracy: result.accuracy,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to generate forecast', { error, productId: req.params.productId });
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Get latest forecast
router.get('/forecast/:productId/latest', async (req: Request, res: Response) => {
  try {
    const forecast = await Forecast.findOne({ productId: req.params.productId })
      .sort({ forecastDate: -1 });

    if (!forecast) {
      return res.status(404).json({ success: false, error: { message: 'No forecast found' } });
    }

    res.json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch forecast' } });
  }
});

// Get forecasts for all products
router.get('/forecasts', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const forecastDays = days ? parseInt(days as string) : 30;

    const products = await Product.find({ isActive: true });
    const forecasts = await Promise.all(
      products.map(async (product) => {
        const result = await forecastEngine.generateForecast(product._id.toString(), forecastDays);
        return {
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          currentStock: product.currentStock,
          ...result,
        };
      })
    );

    res.json({ success: true, data: forecasts, count: forecasts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to generate forecasts' } });
  }
});

// ==================== REORDER ROUTES ====================

// Get reorder recommendations
router.get('/reorder/:productId', async (req: Request, res: Response) => {
  try {
    const result = await forecastEngine.calculateReorderRecommendation(req.params.productId);

    const product = await Product.findById(req.params.productId);

    res.json({
      success: true,
      data: {
        ...result,
        product: product ? { name: product.name, sku: product.sku } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Get reorder recommendations for all products
router.get('/reorder', async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ isActive: true });
    const recommendations = await Promise.all(
      products.map(async (product) => {
        const result = await forecastEngine.calculateReorderRecommendation(product._id.toString());
        return {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          currentStock: product.currentStock,
          safetyStock: product.safetyStock,
          leadTime: product.leadTime,
          ...result,
        };
      })
    );

    // Filter to only products that need reordering
    const needsReorder = recommendations.filter(r => r.shouldReorder);

    res.json({
      success: true,
      data: {
        allProducts: recommendations,
        needsReorder,
        needsReorderCount: needsReorder.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// ==================== ALERT ROUTES ====================

// Get all alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { resolved, type, severity } = req.query;
    const query: Record<string, any> = {};

    if (resolved !== undefined) query.resolved = resolved === 'true';
    if (type) query.type = type;
    if (severity) query.severity = severity;

    const alerts = await Alert.find(query)
      .populate('productId', 'name sku category')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch alerts' } });
  }
});

// Get alerts for a product
router.get('/alerts/:productId', async (req: Request, res: Response) => {
  try {
    const alerts = await Alert.find({ productId: req.params.productId })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch alerts' } });
  }
});

// Check for anomalies and create alerts
router.post('/alerts/check/:productId', async (req: Request, res: Response) => {
  try {
    const alerts = await forecastEngine.detectAnomalies(req.params.productId);

    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Acknowledge alert
router.put('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        acknowledged: true,
        acknowledgedBy: req.body.userId || 'system',
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: { message: 'Alert not found' } });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Resolve alert
router.put('/alerts/:id/resolve', async (req: Request, res: Response) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        resolved: true,
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: { message: 'Alert not found' } });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// ==================== STATISTICS ROUTES ====================

// Get demand statistics
router.get('/stats/:productId', async (req: Request, res: Response) => {
  try {
    const stats = await forecastEngine.getDemandStats(req.params.productId);

    const product = await Product.findById(req.params.productId);

    res.json({
      success: true,
      data: {
        ...stats,
        product: product ? { name: product.name, sku: product.sku, currentStock: product.currentStock } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Get category statistics
router.get('/stats/category/:category', async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await SalesHistory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      { $match: { 'product.category': req.params.category, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$product.name' },
          sku: { $first: '$product.sku' },
          totalSales: { $sum: '$quantity' },
          totalRevenue: { $sum: '$revenue' },
          avgDailySales: { $avg: '$quantity' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.json({ success: true, data: stats, count: stats.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// ==================== SUPPLIER ROUTES ====================

// Get suppliers
router.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: suppliers, count: suppliers.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch suppliers' } });
  }
});

// Create supplier
router.post('/suppliers', async (req: Request, res: Response) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

export default router;

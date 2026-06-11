import { Router, Request, Response } from 'express';
import { Product, Customer, Sale, Inventory } from '../../models';
import { logger } from '../../utils/logger';
import { apiLimiter } from '../../middleware/rateLimit';
import mongoose from 'mongoose';

const router = Router();

// GET /api/analytics/dashboard - Main dashboard
router.get('/dashboard', apiLimiter, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Parallel queries for dashboard
    const [
      todaySales,
      todayRevenue,
      weekSales,
      weekRevenue,
      monthSales,
      monthRevenue,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalCustomers,
      newCustomersToday,
      activeCustomers,
    ] = await Promise.all([
      // Today's sales
      Sale.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'completed',
      }),
      // Today's revenue
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: 'completed',
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Week's sales
      Sale.countDocuments({
        createdAt: { $gte: startOfWeek, $lte: endOfDay },
        status: 'completed',
      }),
      // Week's revenue
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfWeek, $lte: endOfDay },
            status: 'completed',
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Month's sales
      Sale.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfDay },
        status: 'completed',
      }),
      // Month's revenue
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth, $lte: endOfDay },
            status: 'completed',
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Total products
      Product.countDocuments({ isActive: true }),
      // Low stock products
      Product.countDocuments({
        isActive: true,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      }),
      // Out of stock
      Product.countDocuments({ isActive: true, stock: 0 }),
      // Total customers
      Customer.countDocuments(),
      // New customers today
      Customer.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      // Active customers (purchased in last 30 days)
      Sale.distinct('customerId', {
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        customerId: { $ne: null },
      }),
    ]);

    const revenueToday = todayRevenue[0]?.total || 0;
    const revenueWeek = weekRevenue[0]?.total || 0;
    const revenueMonth = monthRevenue[0]?.total || 0;

    // Sales trend (last 7 days)
    const salesTrend = await Sale.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            $lte: endOfDay,
          },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          sales: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top products
    const topProducts = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    // Top customers
    const topCustomers = await Customer.find()
      .sort({ totalSpent: -1 })
      .limit(5)
      .select('name phone email tier totalSpent purchaseCount')
      .lean();

    // Category breakdown
    const categoryBreakdown = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          count: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Payment method distribution
    const paymentDistribution = await Sale.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
    ]);

    // Inventory health
    const inventoryHealth = await Inventory.aggregate([
      {
        $project: {
          status: {
            $cond: [
              { $lte: ['$quantity', 0] },
              'out_of_stock',
              {
                $cond: [
                  { $lte: ['$quantity', '$minStock'] },
                  'low_stock',
                  'in_stock',
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Average order value
    const avgOrderValue = await Sale.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          avgValue: { $avg: '$total' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Refund rate
    const refundStats = await Sale.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          refunded: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] },
          },
        },
      },
    ]);

    const refundRate = refundStats[0]?.total > 0
      ? ((refundStats[0].refunded / refundStats[0].total) * 100).toFixed(2)
      : '0.00';

    // Tier distribution
    const tierDistribution = await Customer.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          totalSpent: { $sum: '$totalSpent' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          today: {
            sales: todaySales,
            revenue: Math.round(revenueToday * 100) / 100,
          },
          week: {
            sales: weekSales,
            revenue: Math.round(revenueWeek * 100) / 100,
          },
          month: {
            sales: monthSales,
            revenue: Math.round(revenueMonth * 100) / 100,
          },
        },
        metrics: {
          avgOrderValue: avgOrderValue[0]
            ? Math.round(avgOrderValue[0].avgValue * 100) / 100
            : 0,
          refundRate: parseFloat(refundRate),
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          totalCustomers,
          newCustomersToday,
          activeCustomers: activeCustomers.length,
        },
        trends: {
          salesTrend,
          categoryBreakdown,
          paymentDistribution,
          inventoryHealth,
          tierDistribution,
        },
        topProducts,
        topCustomers,
      },
    });
  } catch (error: any) {
    logger.error('Dashboard analytics failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
    });
  }
});

// GET /api/analytics/revenue - Revenue analytics
router.get('/revenue', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    const matchStage: any = { status: 'completed' };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
    }

    let dateFormat: string;
    switch (period) {
      case 'hourly':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'weekly':
        dateFormat = '%Y-W%V';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const revenueByPeriod = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$total' },
          sales: { $sum: 1 },
          discount: { $sum: '$discount' },
          tax: { $sum: '$tax' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Compare with previous period
    const prevMatchStage = { ...matchStage };
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const diff = end.getTime() - start.getTime();
      prevMatchStage.createdAt = {
        $gte: new Date(start.getTime() - diff),
        $lte: start,
      };
    }

    const previousPeriod = await Sale.aggregate([
      { $match: prevMatchStage },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalSales: { $sum: 1 } } },
    ]);

    const currentTotal = revenueByPeriod.reduce((sum, r) => sum + r.revenue, 0);
    const previousTotal = previousPeriod[0]?.totalRevenue || 0;
    const growthRate = previousTotal > 0
      ? (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(2)
      : '0.00';

    res.json({
      success: true,
      data: {
        revenueByPeriod,
        summary: {
          currentPeriod: {
            revenue: Math.round(currentTotal * 100) / 100,
            sales: revenueByPeriod.reduce((sum, r) => sum + r.sales, 0),
          },
          previousPeriod: {
            revenue: Math.round(previousTotal * 100) / 100,
            sales: previousPeriod[0]?.totalSales || 0,
          },
          growthRate: parseFloat(growthRate),
        },
      },
    });
  } catch (error: any) {
    logger.error('Revenue analytics failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue analytics',
    });
  }
});

// GET /api/analytics/products - Product analytics
router.get('/products', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 50);

    // Best selling products
    const bestSellers = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          sku: { $first: '$items.sku' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limitNum },
    ]);

    // Highest revenue products
    const topRevenue = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          sku: { $first: '$items.sku' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limitNum },
    ]);

    // Category performance
    const categoryPerformance = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          products: { $sum: 1 },
          itemsSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' },
          avgPrice: { $avg: '$items.price' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Low stock alert
    const lowStockAlerts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .select('name sku stock lowStockThreshold category price')
      .sort({ stock: 1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: {
        bestSellers,
        topRevenue,
        categoryPerformance,
        lowStockAlerts,
      },
    });
  } catch (error: any) {
    logger.error('Product analytics failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get product analytics',
    });
  }
});

// GET /api/analytics/customers - Customer analytics
router.get('/customers', apiLimiter, async (req: Request, res: Response) => {
  try {
    // Customer acquisition over time
    const acquisitionTrend = await Customer.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          newCustomers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    // Lifetime value distribution
    const ltvDistribution = await Customer.aggregate([
      {
        $bucket: {
          groupBy: '$totalSpent',
          boundaries: [0, 100, 500, 1000, 5000, 10000, Infinity],
          default: 'other',
          output: {
            count: { $sum: 1 },
            avgPoints: { $avg: '$loyaltyPoints' },
          },
        },
      },
    ]);

    // Purchase frequency
    const purchaseFrequency = await Sale.aggregate([
      { $match: { customerId: { $ne: null } } },
      {
        $group: {
          _id: '$customerId',
          purchaseCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
      {
        $bucket: {
          groupBy: '$purchaseCount',
          boundaries: [1, 2, 5, 10, 20, Infinity],
          default: 'other',
          output: {
            customers: { $sum: 1 },
            avgSpent: { $avg: '$totalSpent' },
          },
        },
      },
    ]);

    // Top customers by lifetime value
    const topCustomers = await Customer.find()
        .sort({ totalSpent: -1 })
        .limit(20)
        .select('name email tier totalSpent purchaseCount loyaltyPoints')
        .lean();

    res.json({
      success: true,
      data: {
        acquisitionTrend,
        ltvDistribution,
        purchaseFrequency,
        topCustomers,
      },
    });
  } catch (error: any) {
    logger.error('Customer analytics failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get customer analytics',
    });
  }
});

// GET /api/analytics/inventory - Inventory analytics
router.get('/inventory', apiLimiter, async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ isActive: true }).lean();

    const inventoryData = await Promise.all(
      products.map(async (product) => {
        const inventory = await Inventory.findOne({ productId: product._id });
        return {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          stock: product.stock,
          minStock: product.lowStockThreshold,
          maxStock: inventory?.maxStock || product.stock * 5,
          lastRestocked: inventory?.lastRestocked,
          value: product.stock * product.cost,
          status: product.stock === 0
            ? 'out_of_stock'
            : product.stock <= product.lowStockThreshold
            ? 'low_stock'
            : 'in_stock',
        };
      })
    );

    // Stock distribution
    const stockDistribution = inventoryData.reduce(
      (acc, item) => {
        if (item.status === 'out_of_stock') acc.outOfStock++;
        else if (item.status === 'low_stock') acc.lowStock++;
        else if (item.stock >= item.maxStock) acc.overstocked++;
        else acc.inStock++;
        acc.totalValue += item.value;
        return acc;
      },
      { inStock: 0, lowStock: 0, outOfStock: 0, overstocked: 0, totalValue: 0 }
    );

    // Category inventory levels
    const categoryInventory = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalStock: { $sum: '$product.stock' },
          totalValue: {
            $sum: { $multiply: ['$product.stock', '$product.cost'] },
          },
          products: { $sum: 1 },
        },
      },
      { $sort: { totalValue: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        inventory: inventoryData,
        stockDistribution: {
          ...stockDistribution,
          totalValue: Math.round(stockDistribution.totalValue * 100) / 100,
        },
        categoryInventory,
      },
    });
  } catch (error: any) {
    logger.error('Inventory analytics failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get inventory analytics',
    });
  }
});

export default router;
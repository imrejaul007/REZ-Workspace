import { Router, Request, Response } from 'express';
import { dashboardModel } from '../models/Dashboard';
import { aggregationService } from '../services/aggregationService';
import { chartService } from '../services/chartService';
import { DateRange, ExportOptions } from '../types';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { parseISO, isValid, subDays } from 'date-fns';

const router = Router();

// Helper to parse and validate date range
function parseDateRange(req: Request): DateRange | undefined {
  const { startDate, endDate } = req.query;

  if (startDate && endDate) {
    const start = parseISO(startDate as string);
    const end = parseISO(endDate as string);

    if (isValid(start) && isValid(end)) {
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
  }

  return undefined;
}

// ==================== Dashboard Summary ====================

/**
 * GET /api/dashboard/summary
 * Get full dashboard summary with KPIs, charts, and recent data
 */
router.get('/summary', (req: Request, res: Response) => {
  try {
    const dateRange = parseDateRange(req);
    const summary = dashboardModel.getDashboardSummary(dateRange);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard summary',
    });
  }
});

// ==================== KPIs ====================

/**
 * GET /api/dashboard/kpis
 * Get real-time KPIs with optional date range
 */
router.get('/kpis', (req: Request, res: Response) => {
  try {
    const dateRange = parseDateRange(req);
    const kpis = dashboardModel.getKPIs(dateRange);
    const trends = aggregationService.getKPIsWithTrends(dateRange);

    res.json({
      success: true,
      data: {
        ...kpis,
        trends: trends.trends,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KPIs',
    });
  }
});

// ==================== Revenue ====================

/**
 * GET /api/dashboard/revenue
 * Get revenue data with optional date range
 */
router.get('/revenue', (req: Request, res: Response) => {
  try {
    const dateRange = parseDateRange(req);
    const revenueHistory = dashboardModel.getRevenueHistory(dateRange);
    const totalRevenue = revenueHistory.reduce((sum, r) => sum + r.revenue, 0);
    const totalRefunds = revenueHistory.reduce((sum, r) => sum + r.refunds, 0);

    res.json({
      success: true,
      data: {
        history: revenueHistory,
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalRefunds: Math.round(totalRefunds * 100) / 100,
          netRevenue: Math.round((totalRevenue - totalRefunds) * 100) / 100,
          averageDaily: Math.round((totalRevenue / revenueHistory.length) * 100) / 100,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching revenue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue data',
    });
  }
});

/**
 * GET /api/dashboard/revenue/aggregated
 * Get aggregated revenue data
 */
router.get('/revenue/aggregated', (req: Request, res: Response) => {
  try {
    const dateRange = parseDateRange(req);
    const period = (req.query.period as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily';
    const orders = dashboardModel.getOrders(dateRange);
    const aggregation = aggregationService.aggregateRevenue(orders, period, dateRange);

    res.json({
      success: true,
      data: aggregation,
    });
  } catch (error) {
    logger.error('Error fetching aggregated revenue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aggregated revenue',
    });
  }
});

// ==================== Orders ====================

/**
 * GET /api/dashboard/orders
 * Get order analytics with optional date range
 */
router.get('/orders', (req: Request, res: Response) => {
  try {
    const dateRange = parseDateRange(req);
    const orders = dashboardModel.getOrders(dateRange);

    const statusCounts = {
      pending: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
    };

    orders.forEach(order => {
      if (order.status in statusCounts) {
        statusCounts[order.status as keyof typeof statusCounts]++;
      }
    });

    res.json({
      success: true,
      data: {
        orders: orders.slice(0, 100), // Limit for performance
        summary: {
          total: orders.length,
          completed: statusCounts.completed,
          pending: statusCounts.pending,
          cancelled: statusCounts.cancelled,
          refunded: statusCounts.refunded,
          completionRate: Math.round((statusCounts.completed / orders.length) * 10000) / 100,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order data',
    });
  }
});

/**
 * GET /api/dashboard/orders/recent
 * Get recent orders
 */
router.get('/orders/recent', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const recentOrders = dashboardModel.getRecentOrders(limit);

    res.json({
      success: true,
      data: recentOrders,
    });
  } catch (error) {
    logger.error('Error fetching recent orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent orders',
    });
  }
});

// ==================== Customers ====================

/**
 * GET /api/dashboard/customers
 * Get customer metrics with optional date range
 */
router.get('/customers', (req: Request, res: Response) => {
  try {
    const dateRange = parseDateRange(req);
    const metrics = dashboardModel.getCustomerMetrics(dateRange);
    const cohorts = aggregationService.aggregateCustomerCohorts(dateRange);

    res.json({
      success: true,
      data: {
        metrics,
        cohorts,
      },
    });
  } catch (error) {
    logger.error('Error fetching customer metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer metrics',
    });
  }
});

// ==================== Merchants ====================

/**
 * GET /api/dashboard/merchants
 * Get merchant performance with optional date range
 */
router.get('/merchants', (req: Request, res: Response) => {
  try {
    const dateRange = parseDateRange(req);
    const merchants = dashboardModel.getMerchants(dateRange);
    const performance = aggregationService.aggregateMerchantPerformance(dateRange);

    res.json({
      success: true,
      data: {
        merchants,
        summary: {
          totalMerchants: merchants.length,
          topPerformer: merchants[0] || null,
          averageRating: merchants.reduce((sum, m) => sum + m.averageRating, 0) / merchants.length,
          averageFulfillment: merchants.reduce((sum, m) => sum + m.fulfillmentRate, 0) / merchants.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching merchant data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchant data',
    });
  }
});

/**
 * GET /api/dashboard/merchants/:merchantId
 * Get specific merchant details
 */
router.get('/merchants/:merchantId', (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const merchants = dashboardModel.getMerchants();
    const merchant = merchants.find(m => m.merchantId === merchantId);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found',
      });
    }

    const dateRange = parseDateRange(req);
    const orders = dashboardModel.getOrders(dateRange).filter(o => o.merchantId === merchantId);

    res.json({
      success: true,
      data: {
        ...merchant,
        orderHistory: orders.slice(0, 50),
      },
    });
  } catch (error) {
    logger.error('Error fetching merchant details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchant details',
    });
  }
});

// ==================== Products ====================

/**
 * GET /api/dashboard/products
 * Get top products
 */
router.get('/products', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = dashboardModel.getTopProducts(limit);

    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const totalUnits = products.reduce((sum, p) => sum + p.unitsSold, 0);

    res.json({
      success: true,
      data: {
        products,
        summary: {
          totalProducts: products.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalUnitsSold: totalUnits,
          averagePrice: Math.round((totalRevenue / totalUnits) * 100) / 100,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product data',
    });
  }
});

// ==================== Charts ====================

/**
 * GET /api/dashboard/charts
 * Get all chart data
 */
router.get('/charts', (req: Request, res: Response) => {
  try {
    const dateRange = parseDateRange(req);
    const charts = chartService.getAllCharts(dateRange);

    res.json({
      success: true,
      data: charts,
    });
  } catch (error) {
    logger.error('Error fetching charts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chart data',
    });
  }
});

/**
 * GET /api/dashboard/charts/:chartType
 * Get specific chart data
 */
router.get('/charts/:chartType', (req: Request, res: Response) => {
  try {
    const { chartType } = req.params;
    const dateRange = parseDateRange(req);

    const chartGenerators: Record<string, () => ReturnType<typeof chartService.generateRevenueBarChart>> = {
      revenue: () => chartService.generateRevenueBarChart(dateRange),
      orders: () => chartService.generateOrderLineChart(dateRange),
      orderStatus: () => chartService.generateOrderStatusPieChart(dateRange),
      revenueByCategory: () => chartService.generateRevenueByCategoryChart(),
      merchantPerformance: () => chartService.generateMerchantPerformanceChart(dateRange),
      customerGrowth: () => chartService.generateCustomerGrowthChart(dateRange),
      topProducts: () => chartService.generateTopProductsChart(dateRange),
      comparison: () => chartService.generateComparisonChart(dateRange),
      conversionFunnel: () => chartService.generateConversionFunnel(dateRange),
    };

    const generator = chartGenerators[chartType];

    if (!generator) {
      return res.status(400).json({
        success: false,
        error: `Invalid chart type: ${chartType}`,
        validTypes: Object.keys(chartGenerators),
      });
    }

    res.json({
      success: true,
      data: generator(),
    });
  } catch (error) {
    logger.error('Error fetching chart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chart data',
    });
  }
});

// ==================== Export ====================

/**
 * POST /api/dashboard/export
 * Export data to CSV or PDF
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { format: exportFormat, type, dateRange } = req.body as ExportOptions;

    if (!exportFormat || !['csv', 'pdf'].includes(exportFormat)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export format. Must be "csv" or "pdf"',
      });
    }

    if (!type || !['revenue', 'orders', 'customers', 'merchants', 'full'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export type. Must be "revenue", "orders", "customers", "merchants", or "full"',
      });
    }

    const range: DateRange | undefined = dateRange
      ? {
          startDate: parseISO(dateRange.startDate).toISOString().split('T')[0],
          endDate: parseISO(dateRange.endDate).toISOString().split('T')[0],
        }
      : {
          startDate: subDays(new Date(), 30).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        };

    let data: unknown;
    let filename: string;

    switch (type) {
      case 'revenue':
        data = dashboardModel.getRevenueHistory(range);
        filename = `revenue_${range.startDate}_${range.endDate}`;
        break;
      case 'orders':
        data = dashboardModel.getOrders(range);
        filename = `orders_${range.startDate}_${range.endDate}`;
        break;
      case 'customers':
        data = dashboardModel.getCustomerMetrics(range);
        filename = `customers_${range.startDate}_${range.endDate}`;
        break;
      case 'merchants':
        data = dashboardModel.getMerchants(range);
        filename = `merchants_${range.startDate}_${range.endDate}`;
        break;
      case 'full':
        data = dashboardModel.getDashboardSummary(range);
        filename = `dashboard_full_${range.startDate}_${range.endDate}`;
        break;
    }

    if (exportFormat === 'csv') {
      const csv = exportToCSV(data, type);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    } else {
      const pdfBuffer = await exportToPDF(data, type);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      return res.send(pdfBuffer);
    }
  } catch (error) {
    logger.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
    });
  }
});

// ==================== Health & Status ====================

/**
 * GET /api/dashboard/status
 * Get service status and last aggregation time
 */
router.get('/status', (req: Request, res: Response) => {
  const lastAggregation = aggregationService.getLastAggregationTime();

  res.json({
    success: true,
    data: {
      status: 'operational',
      version: '1.0.0',
      lastAggregation: lastAggregation?.toISOString() || null,
      uptime: process.uptime(),
    },
  });
});

export default router;

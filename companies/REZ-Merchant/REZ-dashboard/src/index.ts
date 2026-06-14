/**
 * REZ Dashboard Service
 * Central analytics and dashboard for merchants
 * 
 * @author REZ Team
 * @version 1.0.0
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import { z } from 'zod';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

// Express app
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============== SCHEMAS ==============

const dashboardMetricSchema = new mongoose.Schema({
  merchantId: String,
  date: Date,
  totalSales: Number,
  totalOrders: Number,
  totalCustomers: Number,
  avgOrderValue: Number,
  topProducts: Array,
  hourlyData: Array,
  createdAt: { type: Date, default: Date.now }
});

const DashboardMetric = mongoose.models.DashboardMetric || mongoose.model('DashboardMetric', dashboardMetricSchema);

// ============== ROUTES ==============

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'REZ-dashboard',
    timestamp: new Date().toISOString()
  });
});

/**
 * Dashboard overview for a merchant
 * GET /api/dashboard/:merchantId/overview
 */
app.get('/api/dashboard/:merchantId/overview', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's metrics
    const todayMetrics = await DashboardMetric.findOne({ 
      merchantId, 
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
    });
    
    // Get last 7 days metrics
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const weekMetrics = await DashboardMetric.find({
      merchantId,
      date: { $gte: weekAgo }
    }).sort({ date: -1 });
    
    res.json({
      success: true,
      data: {
        today: todayMetrics || {
          totalSales: 0,
          totalOrders: 0,
          totalCustomers: 0,
          avgOrderValue: 0
        },
        weekly: weekMetrics,
        period: 'last_7_days'
      }
    });
  } catch (error) {
    logger.error('Error fetching overview:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Sales data for charts
 * GET /api/dashboard/:merchantId/sales
 */
app.get('/api/dashboard/:merchantId/sales', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { startDate, endDate } = req.query;
    
    const query: any = { merchantId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    
    const sales = await DashboardMetric.find(query).sort({ date: 1 }).limit(30);
    
    res.json({
      success: true,
      data: sales.map(s => ({
        date: s.date,
        sales: s.totalSales,
        orders: s.totalOrders
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Orders data
 * GET /api/dashboard/:merchantId/orders
 */
app.get('/api/dashboard/:merchantId/orders', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { status } = req.query;
    
    // Mock data for now
    const orders = [];
    
    res.json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Customer data
 * GET /api/dashboard/:merchantId/customers
 */
app.get('/api/dashboard/:merchantId/customers', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    res.json({ 
      success: true, 
      data: {
        total: 0,
        newThisMonth: 0,
        returning: 0,
        topCustomers: []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Product analytics
 * GET /api/dashboard/:merchantId/products
 */
app.get('/api/dashboard/:merchantId/products', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    res.json({
      success: true,
      data: {
        topSelling: [],
        lowStock: [],
        newProducts: []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Staff performance
 * GET /api/dashboard/:merchantId/staff
 */
app.get('/api/dashboard/:merchantId/staff', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    res.json({
      success: true,
      data: {
        topPerformers: [],
        schedule: []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Inventory summary
 * GET /api/dashboard/:merchantId/inventory
 */
app.get('/api/dashboard/:merchantId/inventory', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    res.json({
      success: true,
      data: {
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Full analytics
 * GET /api/dashboard/:merchantId/analytics
 */
app.get('/api/dashboard/:merchantId/analytics', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    res.json({
      success: true,
      data: {
        revenue: [],
        orders: [],
        customers: [],
        trends: {
          sales: { change: 0, trend: 'stable' },
          orders: { change: 0, trend: 'stable' },
          customers: { change: 0, trend: 'stable' }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Real-time metrics via SSE
 * GET /api/dashboard/:merchantId/realtime
 */
app.get('/api/dashboard/:merchantId/realtime', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial connection
  res.write(`data: ${JSON.stringify({ type: 'connected', merchantId: req.params.merchantId })}\n\n`);
  
  // Send periodic updates
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ 
      type: 'ping', 
      timestamp: new Date().toISOString(),
      activeOrders: 0,
      revenue: 0
    })}\n\n`);
  }, 30000);
  
  req.on('close', () => clearInterval(interval));
});

// ============== SERVER ==============

const PORT = process.env.PORT || 4060;

app.listen(PORT, () => {
  logger.info(`REZ-dashboard service started on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app;

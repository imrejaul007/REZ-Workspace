import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import winston from 'winston';
import axios from 'axios';

const PORT = parseInt(process.env.PORT || '4105', 10);
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-retail-analytics';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app: Application = express();
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

// Health checks
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'REZ Retail Analytics Service', port: PORT, mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
app.get('/health/live', (req: Request, res: Response) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) { res.status(503).json({ status: 'not ready' }); return; }
  res.json({ status: 'ready' });
});

// Dashboard Overview
app.get('/api/dashboard/overview', async (req: res, res: Response) => {
  try {
    // Aggregate from POS service
    const overview = {
      totalSales: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      totalCustomers: 0,
      inventoryValue: 0,
      lowStockItems: 0
    };
    res.json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
  }
});

// Sales Report
app.get('/api/reports/sales', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const report = {
      totalSales: 0,
      totalTransactions: 0,
      avgOrderValue: 0,
      topProducts: [],
      salesByHour: [],
      salesByDay: []
    };
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

// Insights
app.get('/api/insights/top-products', async (req: Request, res: Response) => {
  try {
    const insights = {
      topProducts: [],
      trending: [],
      lowPerforming: []
    };
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch insights' });
  }
});

// Customer Analytics
app.get('/api/reports/customers', async (req: Request, res: Response) => {
  try {
    const report = {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      segments: []
    };
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

// Inventory Analytics
app.get('/api/reports/inventory', async (req: Request, res: Response) => {
  try {
    const report = {
      totalSKUs: 0,
      totalValue: 0,
      lowStock: 0,
      outOfStock: 0,
      turnoverRate: 0
    };
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

// Error handling
app.use((req: Request, res: Response) => res.status(404).json({ success: false, error: 'Not found' }));
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error', { error: err.message });
  res.status(err.statusCode || 500).json({ success: false, error: err.message });
});

async function bootstrap() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => logger.info(`REZ Retail Analytics Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => { await mongoose.connection.close(); process.exit(0); });
process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });

bootstrap();
export default app;
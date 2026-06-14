import { logger } from ;
// RisaCare Pharmacy Management Service - Main Entry Point
// B2B Service for Retail and Hospital Pharmacies

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import pharmacyRoutes from './routes/pharmacyRoutes.js';

// Configuration
const PORT = parseInt(process.env.PORT || '4743', 10);
const HOST = process.env.HOST || '0.0.0.0';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_pharmacy';

// Database connection
let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    logger.info('✅ MongoDB connected for Pharmacy Service');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    dbConnected = false;
  }
}

// Create Express app
const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  logger.info(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-pharmacy-management',
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'RisaCare Pharmacy Management Service',
    description: 'B2B Pharmacy Management for Retail and Hospital Pharmacies',
    version: '1.0.0',
    port: PORT,
    endpoints: {
      health: 'GET /health',
      pharmacy: {
        get: 'GET /pharmacy',
        create: 'POST /pharmacy',
        update: 'PUT /pharmacy',
        addPharmacist: 'POST /pharmacy/:pharmacyId/pharmacists',
      },
      medicines: {
        list: 'GET /medicines',
        search: 'GET /medicines/search',
        details: 'GET /medicines/:medicineId',
        create: 'POST /medicines',
        update: 'PUT /medicines/:medicineId',
        batches: 'GET /medicines/:medicineId/batches',
        stockSummary: 'GET /medicines/stock/summary',
      },
      inventory: {
        addStock: 'POST /inventory/stock',
        lowStock: 'GET /inventory/low-stock',
        expiring: 'GET /inventory/expiring',
        reorder: 'GET /inventory/reorder',
        processReorder: 'POST /inventory/reorder',
        valuation: 'GET /inventory/valuation',
        turnover: 'GET /inventory/turnover',
        expiryReport: 'GET /inventory/expiry-report',
      },
      prescriptions: {
        list: 'GET /prescriptions',
        pending: 'GET /prescriptions/pending',
        validate: 'POST /prescriptions/validate',
        details: 'GET /prescriptions/:prescriptionId',
        dispense: 'POST /prescriptions/:prescriptionId/dispense',
        history: 'GET /prescriptions/:prescriptionId/history',
        stats: 'GET /prescriptions/stats',
      },
      sales: {
        list: 'GET /sales',
        create: 'POST /sales',
        daily: 'GET /sales/daily',
        period: 'GET /sales/period',
        summary: 'GET /sales/summary',
        details: 'GET /sales/:saleId',
        invoice: 'GET /sales/:saleId/invoice',
        return: 'POST /sales/:saleId/return',
        patientHistory: 'GET /sales/patient/:patientId',
      },
      suppliers: {
        list: 'GET /suppliers',
        create: 'POST /suppliers',
        details: 'GET /suppliers/:supplierId',
        orders: 'GET /suppliers/:supplierId/orders',
        medicines: 'GET /suppliers/:supplierId/medicines',
        performance: 'GET /suppliers/:supplierId/performance',
        rankings: 'GET /suppliers/rankings',
        search: 'GET /suppliers/search',
      },
      orders: {
        create: 'POST /orders',
        details: 'GET /orders/:orderId',
        updateStatus: 'PUT /orders/:orderId/status',
      },
      stats: 'GET /stats',
    },
  });
});

// API Routes
app.use('/api', pharmacyRoutes);

// Also mount routes at root for convenience
app.use('/', pharmacyRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`[ERROR] ${req.method} ${req.path}:`, err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server with database connection
async function startServer(): Promise<void> {
  try {
    await connectToDatabase();

    app.listen(PORT, HOST, () => {
      logger.info('='.repeat(60));
      logger.info('  RisaCare Pharmacy Management Service');
      logger.info('='.repeat(60));
      logger.info(`  Status:  RUNNING`);
      logger.info(`  Port:    ${PORT}`);
      logger.info(`  Host:    ${HOST}`);
      logger.info(`  Health:  http://localhost:${PORT}/health`);
      logger.info(`  API:     http://localhost:${PORT}/api`);
      logger.info(`  Database: ${dbConnected ? 'connected' : 'disconnected'}`);
      logger.info('='.repeat(60));
      logger.info('');
      logger.info('Available endpoints:');
      logger.info('  GET  /                  - API info');
      logger.info('  GET  /health            - Health check');
      logger.info('  POST /pharmacy          - Setup pharmacy');
      logger.info('  GET  /pharmacy          - Get pharmacy');
      logger.info('  GET  /medicines         - List medicines');
      logger.info('  GET  /medicines/search  - Search medicines');
      logger.info('  GET  /inventory/low-stock    - Low stock alerts');
      logger.info('  GET  /inventory/expiring    - Expiring medicines');
      logger.info('  POST /prescriptions/validate - Validate prescription');
      logger.info('  POST /sales             - Create sale');
      logger.info('  GET  /sales/daily       - Daily sales');
      logger.info('  GET  /suppliers         - List suppliers');
      logger.info('  POST /orders            - Create purchase order');
      logger.info('');
      logger.info('B2B Pharmacy Service ready for RTNM Group - RisaCare');
      logger.info('');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Export app for testing
export { app };

// Start server if this is the main module
startServer().catch(console.error);

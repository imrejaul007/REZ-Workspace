import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from './config/logger';
import { requireAuth, requireAdmin, requireInternal } from './middleware/auth';
import { hrisService } from './integrations/hris';
import { corporateCardService } from './integrations/cards/razorpayCardService';
import { gstService } from './integrations/gst/eInvoiceService';
import { travelService } from './integrations/travel/tboService';
import {
  Company,
  HRISConnection,
  Employee,
  CorporateCard,
  GSTInvoice,
  TravelPolicy,
  TravelBooking,
  TravelRequest,
  BudgetAllocation,
  ExpenseReport
} from './models';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4030;

// Middleware
// CORS - restrict to known origins
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://rez.money,https://admin.rez.money,https://merchant.rez.money').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('CORS blocked'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ==================== HEALTH ROUTES ====================

app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    service: 'rez-corporate-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus
  });
});

app.get('/health/ready', async (req, res) => {
  try {
    await mongoose.connection.db?.admin().ping();
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not_ready' });
  }
});

// ==================== HRIS ROUTES ====================

/**
 * Create HRIS connection
 * POST /api/corporate/hris/connections
 * SECURITY: Requires authentication
 */
app.post('/api/corporate/hris/connections', requireAuth, async (req, res) => {
  try {
    const connection = await hrisService.createConnection(req.body);
    res.json(connection);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get HRIS connections
 * GET /api/corporate/hris/connections/:companyId
 * SECURITY: Requires authentication
 */
app.get('/api/corporate/hris/connections/:companyId', requireAuth, async (req, res) => {
  try {
    const connections = await hrisService.getCompanyConnections(req.params.companyId);
    res.json({ connections });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Connect HRIS
 * POST /api/corporate/hris/connections/:id/connect
 */
app.post('/api/corporate/hris/connections/:id/connect', async (req, res) => {
  try {
    const success = await hrisService.connect(req.params.id);
    res.json({ success });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Sync HRIS
 * POST /api/corporate/hris/connections/:id/sync
 */
app.post('/api/corporate/hris/connections/:id/sync', async (req, res) => {
  try {
    const result = await hrisService.sync(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get employees
 * GET /api/corporate/employees/:companyId
 */
app.get('/api/corporate/employees/:companyId', async (req, res) => {
  try {
    const { department, status, page, limit } = req.query;
    const result = await hrisService.getEmployees(req.params.companyId, {
      department: department as string,
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== CARDS ROUTES ====================

/**
 * Create virtual card
 * POST /api/corporate/cards
 */
app.post('/api/corporate/cards', async (req, res) => {
  try {
    const result = await corporateCardService.createVirtualCard(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get company cards
 * GET /api/corporate/cards/company/:companyId
 */
app.get('/api/corporate/cards/company/:companyId', async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await corporateCardService.getCompanyCards({
      companyId: req.params.companyId,
      status: status as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get employee cards
 * GET /api/corporate/cards/employee/:employeeId
 */
app.get('/api/corporate/cards/employee/:employeeId', async (req, res) => {
  try {
    const cards = await corporateCardService.getEmployeeCards(req.params.employeeId);
    res.json({ cards });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Block card
 * POST /api/corporate/cards/:id/block
 */
app.post('/api/corporate/cards/:id/block', async (req, res) => {
  try {
    const { reason, blockedBy } = req.body;
    await corporateCardService.blockCard({ cardId: req.params.id, reason, blockedBy });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get card transactions
 * GET /api/corporate/cards/transactions/:companyId
 */
app.get('/api/corporate/cards/transactions/:companyId', async (req, res) => {
  try {
    const { cardId, employeeId, startDate, endDate, page, limit } = req.query;
    const result = await corporateCardService.getTransactions({
      cardId: cardId as string,
      employeeId: employeeId as string,
      companyId: req.params.companyId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== GST ROUTES ====================

/**
 * Create invoice
 * POST /api/corporate/gst/invoices
 */
app.post('/api/corporate/gst/invoices', async (req, res) => {
  try {
    const invoice = await gstService.createInvoice(req.body);
    res.json(invoice);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Generate IRN
 * POST /api/corporate/gst/invoices/:id/irn
 */
app.post('/api/corporate/gst/invoices/:id/irn', async (req, res) => {
  try {
    const invoice = await GSTInvoice.findById(req.params.id);
    const result = await gstService.generateIRN(invoice);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Cancel IRN
 * POST /api/corporate/gst/invoices/:id/cancel
 */
app.post('/api/corporate/gst/invoices/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    await gstService.cancelIRN(req.params.id, reason);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Reconcile GSTR-2B
 * POST /api/corporate/gst/reconcile/:companyId
 */
app.post('/api/corporate/gst/reconcile/:companyId', async (req, res) => {
  try {
    const { period } = req.body;
    const result = await gstService.reconcileGSTR2B(req.params.companyId, period);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== TRAVEL ROUTES ====================

/**
 * Search hotels
 * POST /api/corporate/travel/hotels/search
 */
app.post('/api/corporate/travel/hotels/search', async (req, res) => {
  try {
    const hotels = await travelService.searchHotels(req.body);
    res.json({ hotels });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Create travel request
 * POST /api/corporate/travel/requests
 */
app.post('/api/corporate/travel/requests', async (req, res) => {
  try {
    const request = await travelService.createTravelRequest(req.body);
    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Approve travel request
 * POST /api/corporate/travel/requests/:id/approve
 */
app.post('/api/corporate/travel/requests/:id/approve', async (req, res) => {
  try {
    const { approverId, notes } = req.body;
    const request = await travelService.approveTravelRequest({
      requestId: req.params.id,
      approverId,
      notes
    });
    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Book hotel
 * POST /api/corporate/travel/bookings/hotel
 */
app.post('/api/corporate/travel/bookings/hotel', async (req, res) => {
  try {
    const booking = await travelService.bookHotel(req.body);
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get employee bookings
 * GET /api/corporate/travel/bookings/:employeeId
 */
app.get('/api/corporate/travel/bookings/:employeeId', async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await travelService.getEmployeeBookings({
      employeeId: req.params.employeeId,
      status: status as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Cancel booking
 * POST /api/corporate/travel/bookings/:id/cancel
 */
app.post('/api/corporate/travel/bookings/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    await travelService.cancelBooking({ bookingId: req.params.id, reason });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Create travel policy
 * POST /api/corporate/travel/policies
 */
app.post('/api/corporate/travel/policies', async (req, res) => {
  try {
    const policy = await travelService.createTravelPolicy(req.body);
    res.json(policy);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get travel policy
 * GET /api/corporate/travel/policies/:companyId
 */
app.get('/api/corporate/travel/policies/:companyId', async (req, res) => {
  try {
    const policy = await travelService.getTravelPolicy(req.params.companyId);
    res.json(policy);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== COMPANY ROUTES ====================

/**
 * Create company
 * POST /api/corporate/companies
 */
app.post('/api/corporate/companies', async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    res.json(company);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get company
 * GET /api/corporate/companies/:id
 */
app.get('/api/corporate/companies/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-corporate';

    logger.info('Connecting to MongoDB...');

    await mongoose.connect(MONGODB_URI);

    logger.info('Connected to MongoDB successfully');

    app.listen(PORT, () => {
      logger.info(`Corporate Service started on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

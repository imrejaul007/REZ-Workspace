import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database.js';
import config from './config/index.js';
import logger from './utils/logger.js';
import { errorHandler, notFound, internalAuth } from './middleware/index.js';
import { payrollRoutes, taxRoutes, reimbursementRoutes, advanceRoutes } from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'payroll-service',
    version: '1.0.0',
    port: config.port,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// Payroll routes
app.use('/api/payroll', payrollRoutes);

// Tax routes
app.use('/api/tax', taxRoutes);

// Reimbursement routes
app.use('/api/reimbursements', reimbursementRoutes);

// Salary advance routes (nested under payroll)
app.use('/api/payroll/advance', advanceRoutes);

// Internal API routes (requires internal token)
app.use('/api/internal', internalAuth, (_req, res) => {
  res.json({ success: true, message: 'Internal API access granted' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   💰 CorpPerks Payroll Service                           ║
║                                                           ║
║   Server running on port ${String(config.port).padEnd(29)}║
║   Environment: ${config.nodeEnv.padEnd(29)}║
║   MongoDB: ${config.mongoUri.substring(0, 40).padEnd(40)}   ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST   /api/payroll/run                              ║
║   • GET    /api/payroll/runs                             ║
║   • GET    /api/payroll/payslips/:employeeId             ║
║   • GET    /api/payroll/payslip/:id                      ║
║   • POST   /api/payroll/advance                          ║
║   • GET    /api/tax/declarations/:employeeId             ║
║   • POST   /api/tax/declarations                        ║
║   • GET    /api/reimbursements/:employeeId               ║
║   • POST   /api/reimbursements                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

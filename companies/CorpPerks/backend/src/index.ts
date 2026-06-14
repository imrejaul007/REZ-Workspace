import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { connectDB } from './config/database.js';
import { errorHandler, notFound, tenantMiddleware } from './middleware/index.js';
import {
  authRoutes,
  employeeRoutes,
  leaveRoutes,
  attendanceRoutes,
  shiftRoutes,
  userRoutes,
  departmentRoutes,
  hotelRoutes,
} from './routes/index.js';

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

// Tenant middleware
app.use(tenantMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'corpperks-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/hotels', hotelRoutes);

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
║   🏢 CorpPerks Backend API                               ║
║                                                           ║
║   Server running on port ${config.port}                       ║
║   Environment: ${config.nodeEnv.padEnd(20)}                   ║
║   MongoDB: ${config.mongoUri.substring(0, 40).padEnd(40)}   ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST /api/auth/register                               ║
║   • POST /api/auth/login                                  ║
║   • GET  /api/auth/me                                     ║
║   • GET  /api/employees                                  ║
║   • GET  /api/leave                                      ║
║   • GET  /api/attendance                                  ║
║   • GET  /api/shifts                                     ║
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

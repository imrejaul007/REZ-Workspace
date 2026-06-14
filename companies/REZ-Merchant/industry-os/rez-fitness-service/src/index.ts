import express, { Application, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import membersRoutes from './routes/members.routes';
import classesRoutes from './routes/classes.routes';
import trainersRoutes from './routes/trainers.routes';
import { Membership, MemberMembership } from './models/Membership';
import { attendanceService, billingService } from './services/AttendanceService';
import { Attendance, Billing } from './services/AttendanceService';
import { authenticateToken } from './middleware/auth';

const app: Application = express();
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration - restrict origins in production
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

if (isProduction && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: { success: false, error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: isProduction ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000']),
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(generalLimiter);

// Health check (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-fitness-service', timestamp: new Date().toISOString() });
});

// Routes with authentication and rate limiting
app.use('/api/members', authLimiter, membersRoutes);
app.use('/api/classes', authLimiter, classesRoutes);
app.use('/api/trainers', authLimiter, trainersRoutes);

// Membership routes (protected)
app.get('/api/memberships', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const memberships = await Membership.find({ isActive: true });
    res.json({ success: true, data: memberships });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch memberships' });
  }
});

app.post('/api/memberships', authenticateToken, async (req: Request, res: Response) => {
  try {
    const membership = new Membership(req.body);
    await membership.save();
    res.status(201).json({ success: true, data: membership });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create membership' });
  }
});

app.get('/api/memberships/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      res.status(404).json({ success: false, error: 'Membership not found' });
      return;
    }
    res.json({ success: true, data: membership });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch membership' });
  }
});

// Billing routes (protected)
app.post('/api/billing/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { memberId, membershipId, classId, amount, description, dueDate, currency } = req.body;
    const billing = await billingService.createBilling({
      memberId,
      membershipId,
      classId,
      amount,
      description,
      dueDate: new Date(dueDate),
      currency: currency || 'INR',
    });
    res.json({ success: true, data: billing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create billing' });
  }
});

// Attendance routes (protected)
app.post('/api/attendance/checkin', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { memberId, gymId } = req.body;
    const attendance = await attendanceService.checkIn(memberId, gymId);
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check in' });
  }
});

// Billing history (protected)
app.get('/api/billing/history/:memberId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const history = await billingService.getMemberBilling(memberId);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch billing history' });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[Startup] Connected to MongoDB');

    app.listen(4005, () => {
      logger.info('[Startup] Fitness service running on port 4005');
      logger.info('[Startup] Health: http://localhost:4005/health');
      logger.info(`[Startup] CORS origins: ${corsOrigins.length > 0 ? corsOrigins.join(', ') : 'development defaults'}`);
    });
  } catch (error) {
    console.error('[Startup] Failed to start server:', error);
    process.exit(1);
  }
}

start();

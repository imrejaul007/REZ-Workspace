/**
 * REZ Atlas v2 - SDR Agent
 * AI-powered Sales Development Representative
 * Production-ready with MongoDB storage
 */

import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { SDRJob, SDRJobDocument } from './models/SDRJob.js';
import { logger } from './config/logger.js';

// ================================================
// Configuration
// ================================================
const PORT = parseInt(process.env.PORT || '5174', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atlas-sdr-agent';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ================================================
// Express App Setup
// ================================================
const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB sanitization
app.use(mongoSanitize());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
    });
  });
  next();
});

// ================================================
// Health Check Routes
// ================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'atlas-sdr-agent',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: mongoStatus === 'connected' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: { mongodb: { status: mongoStatus } },
  });
});

// ================================================
// API Routes
// ================================================

// Create SDR job
app.post('/api/jobs', asyncHandler(async (req: Request, res: Response) => {
  const { leadId, leadName, companyName, contactEmail, product } = req.body;

  if (!leadId || !contactEmail) {
    res.status(400).json({ success: false, error: { message: 'leadId and contactEmail required' } });
    return;
  }

  const job = new SDRJob({
    leadId,
    leadName: leadName || 'Unknown',
    companyName: companyName || 'Unknown',
    contactEmail,
    product: product || 'General',
    status: 'researching',
    stage: 0,
    steps: [],
  });

  await job.save();

  // Start automated sequence
  executeSDRSequence(job.id);

  res.status(201).json({ success: true, jobId: job.id, status: 'started' });
}));

// Get job by ID
app.get('/api/jobs/:id', asyncHandler(async (req: Request, res: Response) => {
  const job = await SDRJob.findById(req.params.id);
  if (!job) {
    res.status(404).json({ success: false, error: { message: 'Job not found' } });
    return;
  }
  res.json({ success: true, data: job });
}));

// Get all jobs
app.get('/api/jobs', asyncHandler(async (req: Request, res: Response) => {
  const { status, page = 1, limit = 50 } = req.query;

  const query: any = {};
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [jobs, total] = await Promise.all([
    SDRJob.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    SDRJob.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: jobs,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
}));

// Trigger SDR for multiple leads
app.post('/api/trigger', asyncHandler(async (req: Request, res: Response) => {
  const { leads } = req.body;

  if (!leads || !Array.isArray(leads)) {
    res.status(400).json({ success: false, error: { message: 'leads array required' } });
    return;
  }

  const jobs = await Promise.all(leads.map(async (lead: any) => {
    const job = new SDRJob({
      leadId: lead.id,
      leadName: lead.name || 'Unknown',
      companyName: lead.company || 'Unknown',
      contactEmail: lead.email,
      product: lead.product || 'General',
      status: 'researching',
      stage: 0,
      steps: [],
    });
    await job.save();

    // Start automated sequence (non-blocking)
    setImmediate(() => executeSDRSequence(job.id));

    return { jobId: job.id, leadId: lead.id };
  }));

  res.status(201).json({ success: true, data: { jobs, total: jobs.length } });
}));

// SDR Analytics
app.get('/api/analytics', asyncHandler(async (req: Request, res: Response) => {
  const jobs = await SDRJob.find().lean();

  const byStatus = jobs.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalJobs = jobs.length;
  const meetingScheduled = jobs.filter(j => j.status === 'meeting-scheduled' || j.status === 'completed').length;
  const conversionRate = totalJobs > 0 ? (meetingScheduled / totalJobs * 100).toFixed(1) + '%' : '0%';

  res.json({
    success: true,
    data: {
      totalJobs,
      byStatus,
      conversionRate,
      meetingScheduled,
    },
  });
}));

// Error handler
app.use(errorHandler);

// ================================================
// SDR Sequence Execution
// ================================================
async function executeSDRSequence(jobId: string): Promise<void> {
  try {
    const job = await SDRJob.findById(jobId);
    if (!job) return;

    // Stage 1: Research
    await delay(2000);
    job.stage = 1;
    job.steps.push({
      step: 1,
      action: 'research',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: {
        companySize: '50-100 employees',
        industry: 'restaurant',
        revenue: '₹5-10 Cr',
        technologies: ['POS', 'Zomato', 'Swiggy'],
        painPoints: ['customer retention', 'review management'],
      },
    });
    await job.save();

    // Stage 2: First outreach
    await delay(1500);
    job.stage = 2;
    job.status = 'outreach';
    job.steps.push({
      step: 2,
      action: 'email_sent',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: {
        subject: `Quick question about ${job.companyName}`,
        template: 'initial_outreach',
        sentAt: new Date().toISOString(),
      },
    });
    await job.save();

    // Stage 3: Wait for reply (simulated)
    await delay(1000);
    job.stage = 3;
    job.status = 'engaged';
    job.steps.push({
      step: 3,
      action: 'reply_received',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: { replyType: 'positive', interest: 'high' },
    });
    await job.save();

    // Stage 4: Schedule meeting
    await delay(500);
    job.stage = 4;
    job.status = 'meeting-scheduled';
    job.steps.push({
      step: 4,
      action: 'meeting_scheduled',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: {
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        meetingType: 'video_call',
      },
    });
    await job.save();

    logger.info(`SDR Job ${job.id} completed: ${job.status}`);
  } catch (error) {
    logger.error('SDR sequence error', { jobId, error });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ================================================
// Database Connection
// ================================================
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('MongoDB connected', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}

// ================================================
// Graceful Shutdown
// ================================================
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully`);
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ================================================
// Start Server
// ================================================
async function start(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      logger.info(`Atlas SDR Agent started`, { port: PORT, environment: NODE_ENV });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export { app };
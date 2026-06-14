import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import { createClient } from 'redis';
import { rateLimit } from 'express-rate-limit';
import rulesRoutes from './routes/rules';
import jobsRoutes from './routes/jobs';
import { AiUpdateService } from './services/aiUpdateService';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'REZ-ai-crm-updates',
    version: '1.0.0',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/v1/rules', rulesRoutes);
app.use('/api/v1/jobs', jobsRoutes);

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Scheduler for auto-update rules
let schedulerInterval: NodeJS.Timeout;

function startScheduler(): void {
  // Run every minute to check for scheduled rules
  schedulerInterval = setInterval(async () => {
    try {
      await AiUpdateService.runScheduledRules();
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  }, 60000);

  console.log('Scheduler started');
}

// Start
const PORT = parseInt(process.env.PORT || '4136');

async function start(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_ai_crm_updates';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Start scheduler
    startScheduler();

    app.listen(PORT, () => {
      console.log(`REZ AI CRM Updates Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  clearInterval(schedulerInterval);
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  clearInterval(schedulerInterval);
  await mongoose.connection.close();
  process.exit(0);
});

start();

export { app };

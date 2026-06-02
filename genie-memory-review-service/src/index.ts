/**
 * GENIE Memory Review Service - Main Entry Point
 * Port: 4717
 */
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { createLogger } from './utils/logger.js';
import { tenantMiddleware } from './middleware/tenant.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { getReviewScheduler } from './services/scheduler.js';

const SERVICE = 'genie-memory-review-service';
const PORT = parseInt(process.env.PORT || '4717', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genie-memory-review';
const logger = createLogger(SERVICE);

const app = express();
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } } }));
app.use(cors());
app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMIT' } } }));
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(tenantMiddleware());
app.use('/api/reviews', reviewRoutes);

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'healthy', service: SERVICE }));
app.get('/health/live', (_req: Request, res: Response) => { res.json({ status: 'ok' }); });
app.get('/health/ready', async (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;
  res.json({ status: mongoState === 1 ? 'ready' : 'not_ready', checks: { mongodb: mongoState === 1 ? 'connected' : 'disconnected' } });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('mongodb_connected');

    // Start the review scheduler
    getReviewScheduler().start();

    app.listen(PORT, () => console.log(`\n  GENIE Memory Review Service running on port ${PORT}\n  Scheduler: ACTIVE\n`));
  } catch (error) { logger.error('start_failed', { error }); process.exit(1); }
}
process.on('SIGTERM', async () => {
  getReviewScheduler().stop();
  await mongoose.connection.close();
  process.exit(0);
});
start();
export default app;

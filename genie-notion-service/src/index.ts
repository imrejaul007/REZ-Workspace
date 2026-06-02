/**
 * GENIE Notion Service - Main Entry Point
 * Port: 4713
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

const SERVICE_NAME = 'genie-notion-service';
const SERVICE_VERSION = '1.0.0';
const PORT = parseInt(process.env.PORT || '4713', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genie-notion';
const logger = createLogger(SERVICE_NAME);
const app = express();

app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } } }));
app.use(cors());
app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } } }));
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(tenantMiddleware());

// OAuth endpoint placeholder
app.post('/api/notion/oauth', async (req: Request, res: Response) => {
  const { tenant_id } = req.tenantContext || {};
  logger.info('notion_oauth', { tenant_id });
  res.json({ success: true, data: { message: 'Notion OAuth endpoint - configure NOTION_CLIENT_ID and NOTION_CLIENT_SECRET' } });
});

// Sync endpoint placeholder
app.post('/api/notion/sync', async (req: Request, res: Response) => {
  const { tenant_id, user_id } = req.tenantContext || {};
  logger.info('notion_sync', { tenant_id, user_id });
  res.json({ success: true, data: { message: 'Notion sync endpoint - configure Notion API client' } });
});

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'healthy', service: SERVICE_NAME, version: SERVICE_VERSION }));
app.get('/health/live', (_req: Request, res: Response) => res.json({ status: 'ok' }));
app.get('/health/ready', async (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;
  res.json({ status: mongoState === 1 ? 'ready' : 'not_ready' });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('mongodb_connected');
    app.listen(PORT, () => console.log(`\n  GENIE Notion Service (${SERVICE_VERSION}) running on port ${PORT}\n  "You don't use Genie. You talk to Genie."\n`));
  } catch (error) {
    logger.error('start_failed', { error });
    process.exit(1);
  }
}
process.on('SIGTERM', () => { mongoose.connection.close(); process.exit(0); });
start();
export default app;

/**
 * GENIE Discord Service - Main Entry Point
 * Port: 4714
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
import discordRoutes from './routes/discordRoutes.js';
import { getDiscordService } from './services/discordService.js';

const SERVICE_NAME = 'genie-discord-service';
const SERVICE_VERSION = '1.0.0';
const PORT = parseInt(process.env.PORT || '4714', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genie-discord';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const logger = createLogger(SERVICE_NAME);

const app = express();
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } } }));
app.use(cors());
app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMIT' } } }));
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(tenantMiddleware());
app.use('/api/discord', discordRoutes);

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'healthy', service: SERVICE_NAME, version: SERVICE_VERSION }));
app.get('/health/live', (_req: Request, res: Response) => res.json({ status: 'ok' }));
app.get('/health/ready', async (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;
  const discordReady = getDiscordService().isReady();
  res.json({ status: mongoState === 1 && discordReady ? 'ready' : 'not_ready', checks: { mongodb: mongoState === 1 ? 'connected' : 'disconnected', discord: discordReady ? 'ready' : 'not_configured' } });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('mongodb_connected');

    if (DISCORD_BOT_TOKEN) {
      const discord = getDiscordService();
      await discord.initialize(DISCORD_BOT_TOKEN);
      logger.info('discord_bot_initialized');
    }

    app.listen(PORT, () => console.log(`\n  GENIE Discord Service (${SERVICE_VERSION}) running on port ${PORT}\n  "You don't use Genie. You talk to Genie."\n`));
  } catch (error) {
    logger.error('start_failed', { error });
    process.exit(1);
  }
}
process.on('SIGTERM', async () => { await getDiscordService().destroy(); await mongoose.connection.close(); process.exit(0); });
start();
export default app;

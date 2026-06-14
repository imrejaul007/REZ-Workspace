import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import config from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler, asyncHandler } from './utils/errors';
import routes from './routes';

const app: Express = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: config.cors.credentials }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

app.use(rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.maxRequests, message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }, standardHeaders: true, legacyHeaders: false }));

app.use('/api/v1/itineraries', routes);
app.use('/api/v1/trips', routes);

app.get('/', (req: Request, res: Response) => { res.json({ service: 'Airzy Itinerary Service', version: config.version, status: 'running' }); });
app.get('/health', (req: Request, res: Response) => { res.json({ status: 'healthy', timestamp: Date.now(), version: config.version }); });

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected');
    app.listen(config.server.port, config.server.host, () => { logger.info(`Airzy Itinerary Service started on port ${config.server.port}`); });
  } catch (error) { logger.error('Failed to start server', { error }); process.exit(1); }
}

process.on('uncaughtException', (err) => { logger.error('Uncaught exception', { error: err.message }); process.exit(1); });
process.on('unhandledRejection', (reason) => { logger.error('Unhandled rejection', { reason }); });

startServer();
export default app;
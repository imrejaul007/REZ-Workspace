import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import winston from 'winston';

const PORT = parseInt(process.env.PORT || '4102', 10);
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-retail-loyalty';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

import loyaltyRoutes from './routes/loyalty';

const app: Application = express();
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => logger.info('Request', { method: req.method, path: req.path, status: res.statusCode, duration: Date.now() - start }));
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'REZ Retail Loyalty Service', port: PORT, mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
app.get('/health/live', (req: Request, res: Response) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) { res.status(503).json({ status: 'not ready' }); return; }
  res.json({ status: 'ready' });
});

app.use('/api', loyaltyRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ name: 'REZ Retail Loyalty Service', version: '1.0.0', port: PORT, endpoints: ['/api/programs', '/api/accounts', '/api/transactions', '/api/rewards'] });
});

app.use((req: Request, res: Response) => res.status(404).json({ success: false, error: 'Not found' }));
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error', { error: err.message });
  res.status(err.statusCode || 500).json({ success: false, error: err.message });
});

async function bootstrap() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`REZ Retail Loyalty Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => { await mongoose.connection.close(); process.exit(0); });
process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });

bootstrap();
export default app;
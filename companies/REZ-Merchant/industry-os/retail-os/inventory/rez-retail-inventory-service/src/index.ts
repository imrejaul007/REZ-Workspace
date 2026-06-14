import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';

import { connectDatabase } from './config/database';
import { initRedis } from './config/redis';
import { logger } from './utils/logger';

import inventoryRoutes from './routes/inventory.routes';
import alertsRoutes from './routes/alerts.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4103;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'rez-retail-inventory-service' });
});

app.use('/api/inventory', inventoryRoutes);
app.use('/api/alerts', alertsRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'REZ Retail Smart Inventory Service',
    version: '1.0.0',
    description: 'Smart Inventory Management with Alerts and Purchase Orders',
  });
});

// Scheduled task: Check stock levels every hour
cron.schedule('0 * * * *', async () => {
  logger.info('Running scheduled stock level check');
  // This would trigger stock checks with the retail service
});

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await initRedis();
    app.listen(PORT, () => logger.info(`Inventory Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
};

startServer();

export default app;

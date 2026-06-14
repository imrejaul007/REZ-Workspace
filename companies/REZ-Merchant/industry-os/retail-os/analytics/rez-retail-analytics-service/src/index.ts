import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { initRedis } from './config/redis';
import { logger } from './utils/logger';

import salesRoutes from './routes/sales.routes';
import customersRoutes from './routes/customers.routes';
import productsRoutes from './routes/products.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4105;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'rez-retail-analytics-service' });
});

app.use('/api/sales', salesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'REZ Retail Analytics Service',
    version: '1.0.0',
    description: 'Sales, Customer, and Product Analytics',
  });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await initRedis();
    app.listen(PORT, () => logger.info(`Analytics Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
};

startServer();

export default app;

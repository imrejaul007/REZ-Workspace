import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { initRedis } from './config/redis';
import { logger } from './utils/logger';

import transactionRoutes from './routes/transaction.routes';
import paymentRoutes from './routes/payment.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4104;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'rez-retail-pos-service' });
});

app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'REZ Retail POS Service',
    version: '1.0.0',
    description: 'Point of Sale Service for Retail',
  });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await initRedis();
    app.listen(PORT, () => logger.info(`POS Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
};

startServer();

export default app;

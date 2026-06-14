import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';

import logger from 'utils/logger.js';
import { register, httpRequestsTotal, httpRequestDuration } from './utils/metrics';
import { emailRoutes } from './routes';
import { emailService } from './services';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5042;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.labels(req.method, req.path, res.statusCode.toString()).inc();
    httpRequestDuration.labels(req.method, req.path, res.statusCode.toString()).observe(duration);
  });
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'email-automation',
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

app.use('/api', emailRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_email_automation';
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected');

    await emailService.initialize();

    cron.schedule('* * * * *', async () => {
      try {
        await emailService.processDueEnrollments();
      } catch (error) {
        logger.error('Error processing due enrollments', { error });
      }
    });

    app.listen(PORT, () => {
      logger.info(`Email automation service running on port ${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await emailService.cleanup();
  await mongoose.disconnect();
  process.exit(0);
});

startServer();

export default app;
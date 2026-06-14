import express, { Request, Response, NextFunction } from 'express';
import { tracingMiddleware } from './middleware/tracing';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import auditRoutes from './routes/audit.routes';
import complianceRoutes from './routes/compliance.routes';
import reportsRoutes from './routes/reports.routes';
import { correlationIdMiddleware } from './middleware/audit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { auditLogger, logger } from './services/auditLogger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3025;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(correlationIdMiddleware);

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'rez-audit-service',
    version: '1.0.0'
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'ReZ Audit Service',
    version: '1.0.0',
    description: 'Comprehensive audit trail and compliance reporting service',
    endpoints: {
      audit: '/api/audit',
      compliance: '/api/compliance',
      reports: '/api/reports',
      health: '/health'
    }
  });
});

app.use('/api/audit', auditRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/reports', reportsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

auditLogger.logSystemEvent('SYSTEM_STARTUP', { port: PORT });

const server = app.listen(PORT, () => {
  logger.info(`ReZ Audit Service running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  auditLogger.logSystemEvent('SYSTEM_SHUTDOWN', { signal });

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;

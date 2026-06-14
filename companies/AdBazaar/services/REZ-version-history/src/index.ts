import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { createLogger, LogLevel } from './utils/logger';
import contentRoutes from './routes/content.routes';
import versionRoutes from './routes/version.routes';
import collaborationRoutes from './routes/collaboration.routes';
import auditRoutes from './routes/audit.routes';
import tagRoutes from './routes/tag.routes';

// Load environment variables
dotenv.config();

const logger = createLogger('REZ-VersionHistory', LogLevel.INFO);
const app = express();
const PORT = process.env.PORT || 4799;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-VersionHistory',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/content', contentRoutes);
app.use('/api/content', versionRoutes);
app.use('/api/content', collaborationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/content', tagRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`REZ-VersionHistory started on port ${PORT}`);
});

export default app;

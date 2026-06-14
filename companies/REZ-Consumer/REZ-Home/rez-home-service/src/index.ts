import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { servicesRouter } from './routes/services';

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Environment variables
const PORT = parseInt(process.env.PORT || '4702', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Express app
const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      requestId: (req as any).requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start
    });
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-home-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-home-service',
    version: '1.0.0'
  });
});

// Mount routes
app.use('/api/v1/services', servicesRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    requestId: (req as any).requestId,
    error: err.message,
    stack: err.stack
  });

  res.status(500).json({
    error: 'Internal server error',
    requestId: (req as any).requestId
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`REZ-Home Service Catalog started on port ${PORT}`);
  logger.info(`Environment: ${NODE_ENV}`);
});

export default app;

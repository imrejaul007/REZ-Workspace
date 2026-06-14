import express, { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './config/database';
import customersRouter from './routes/customers.routes';
import campaignsRouter from './routes/campaigns.routes';

const app = express();
const PORT = process.env.PORT || 4007;

// Middleware
app.use(helmet());

// CORS configuration - restrict origins in production
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];
const isProduction = process.env.NODE_ENV === 'production';

// CRITICAL FIX: Never allow '*' in production
if (isProduction && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

app.use(cors({
  origin: isProduction ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000', 'http://localhost:8080']),
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-restaurant-crm-service', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/customers', customersRouter);
app.use('/api/campaigns', campaignsRouter);

// Legacy routes for backward compatibility
app.use('/api/visits', campaignsRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
async function start() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      logger.info(`Restaurant CRM Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Customers API: http://localhost:${PORT}/api/customers`);
      logger.info(`Campaigns API: http://localhost:${PORT}/api/campaigns`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;

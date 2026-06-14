import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config';
import { logger } from './utils/logger';

import customersRoutes from './routes/customers';
import interactionsRoutes from './routes/interactions';

class Server {
  public app: Application;
  private server: any;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'] }));
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request processed', { method: req.method, path: req.path, statusCode: res.statusCode, duration: `${duration}ms` });
      });
      next();
    });
  }

  private configureRoutes(): void {
    this.app.get('/health', (req: Request, res: Response) => {
      const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      res.json({ status: 'healthy', service: 'REZ Retail CRM Service', version: '1.0.0', port: config.port, mongodb: mongoStatus, timestamp: new Date().toISOString() });
    });

    this.app.get('/health/live', (req: Request, res: Response) => res.json({ status: 'alive' }));
    this.app.get('/health/ready', async (req: Request, res: Response) => {
      const mongoReady = mongoose.connection.readyState === 1;
      if (!mongoReady) { res.status(503).json({ status: 'not ready' }); return; }
      res.json({ status: 'ready' });
    });

    this.app.use('/api/customers', customersRoutes);
    this.app.use('/api/interactions', interactionsRoutes);

    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'REZ Retail CRM Service',
        description: 'Customer relationship management for retail',
        version: '1.0.0',
        endpoints: { health: '/health', customers: '/api/customers', interactions: '/api/interactions' },
      });
    });
  }

  private configureErrorHandling(): void {
    this.app.use((req: Request, res: Response) => res.status(404).json({ success: false, error: 'Endpoint not found' }));
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      logger.error('Error', { error: err.message, path: req.path });
      res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal error' });
    });
  }

  public async connectMongoDB(): Promise<void> {
    try {
      await mongoose.connect(config.mongoUri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
      logger.info('Connected to MongoDB');
 mongoose.connection.on('error', (err) => logger.error('MongoDB error', { error: err }));
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error });
      throw error;
    }
  }

  public start(): void {
    this.server = this.app.listen(config.port, () => {
      logger.info('╔══════════════════════════════════════════════════════════════╗');
      logger.info('║                 REZ RETAIL CRM SERVICE v1.0.0              ║');
      logger.info('║            Customer Relationship Management                ║');
      logger.info(`║  Port: ${config.port}                                               ║`);
      logger.info('╚══════════════════════════════════════════════════════════════╝');
    });

    this.server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') { logger.error(`Port ${config.port} is already in use`); process.exit(1); }
      logger.error('Server error', { error });
    });
  }

  public async shutdown(signal: string): Promise<void> {
    logger.info(`${signal} received. Shutting down...`);
    if (this.server) this.server.close();
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
    process.exit(0);
  }
}

const server = new Server();
process.on('SIGTERM', () => server.shutdown('SIGTERM'));
process.on('SIGINT', () => server.shutdown('SIGINT'));
process.on('uncaughtException', (error) => { logger.error('Uncaught Exception', { error }); server.shutdown('uncaughtException'); });

async function bootstrap(): Promise<void> {
  try {
    await server.connectMongoDB();
    server.start();
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();
export default server;
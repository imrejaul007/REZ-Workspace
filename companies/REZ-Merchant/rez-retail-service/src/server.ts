import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config';
import { logger } from './utils/logger';

// Routes
import productsRoutes from './routes/products';
import storesRoutes from './routes/stores';
import categoriesRoutes from './routes/categories';
import employeesRoutes from './routes/employees';
import suppliersRoutes from './routes/suppliers';

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
    // Security headers
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request processed', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
        });
      });
      next();
    });
  }

  private configureRoutes(): void {
    // Health checks
    this.app.get('/health', (req: Request, res: Response) => {
      const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      res.json({
        status: 'healthy',
        service: 'REZ Retail Service',
        version: '1.0.0',
        port: config.port,
        environment: config.nodeEnv,
        uptime: process.uptime(),
        mongodb: mongoStatus,
        timestamp: new Date().toISOString(),
      });
    });

    this.app.get('/health/live', (req: Request, res: Response) => {
      res.json({ status: 'alive', timestamp: new Date().toISOString() });
    });

    this.app.get('/health/ready', async (req: Request, res: Response) => {
      const mongoReady = mongoose.connection.readyState === 1;
      if (!mongoReady) {
        res.status(503).json({ status: 'not ready', checks: { mongodb: 'not ready' } });
        return;
      }
      res.json({ status: 'ready', checks: { mongodb: 'ready' } });
    });

    // API routes
    this.app.use('/api/products', productsRoutes);
    this.app.use('/api/stores', storesRoutes);
    this.app.use('/api/categories', categoriesRoutes);
    this.app.use('/api/employees', employeesRoutes);
    this.app.use('/api/suppliers', suppliersRoutes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'REZ Retail Service',
        description: 'Core retail operations - products, stores, employees',
        version: '1.0.0',
        status: 'operational',
        endpoints: {
          health: '/health',
          products: '/api/products',
          stores: '/api/stores',
          categories: '/api/categories',
          employees: '/api/employees',
          suppliers: '/api/suppliers',
        },
      });
    });
  }

  private configureErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
      });
    });

    // Global error handler
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      logger.error('Request error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
      });

      res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
      });
    });
  }

  public async connectMongoDB(): Promise<void> {
    try {
      const options: mongoose.ConnectionOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      await mongoose.connect(config.mongoUri, options);

      logger.info('Connected to MongoDB', {
        uri: config.mongoUri.replace(/\/\/.*@/, '//<credentials>@'),
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: err });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error });
      throw error;
    }
  }

  public start(): void {
    this.server = this.app.listen(config.port, () => {
      logger.info('╔══════════════════════════════════════════════════════════════╗');
      logger.info('║                    REZ RETAIL SERVICE v1.0.0                 ║');
      logger.info('║              Core Retail Operations Platform                 ║');
      logger.info('╠══════════════════════════════════════════════════════════════╣');
      logger.info(`║  Port: ${config.port}                                               ║`);
      logger.info(`║  Environment: ${config.nodeEnv}                                       ║`);
      logger.info('║  Features: Products, Stores, Categories, Employees         ║');
      logger.info('╚══════════════════════════════════════════════════════════════╝');
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`API base: http://localhost:${config.port}/api`);
    });

    // Handle server errors
    this.server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      }
      logger.error('Server error', { error });
    });
  }

  public async shutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    if (this.server) {
      this.server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      } catch (error) {
        logger.error('Error closing MongoDB connection', { error });
      }
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  }
}

// Create server instance
const server = new Server();

// Handle shutdown signals
process.on('SIGTERM', () => server.shutdown('SIGTERM'));
process.on('SIGINT', () => server.shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error, stack: error.stack });
  server.shutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// Start the server
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

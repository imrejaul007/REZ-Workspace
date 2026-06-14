import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import automationRoutes from './routes/automation.routes';
import { emailService } from './services/emailService';
import { smsService } from './services/smsService';
import { automationWorker } from './workers/automationWorker';
import logger from './utils/logger';

// Configuration
const PORT = process.env.PORT || 4020;

function validateEnv(): void {
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    throw new Error('MONGODB_URI or MONGO_URI is required');
  }
  // Fail-closed: Redis is required for BullMQ job queue
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required');
  }
  // Service tokens for internal service communication
  if (!process.env.INTERNAL_SERVICE_TOKENS_JSON && !process.env.INTERNAL_SERVICE_TOKEN) {
    throw new Error('INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN is required');
  }
}

// Allowed domains for URL tracking (open redirect prevention)
const ALLOWED_TRACK_DOMAINS = (process.env.ALLOWED_TRACK_DOMAINS || 'rezapp.com,rez.com,rezapp.io')
  .split(',')
  .map((d) => d.trim().toLowerCase());

// Private IP ranges to block
const PRIVATE_IP_PATTERNS = [
  /^127\./,                           // Loopback
  /^10\./,                           // Class A private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
  /^192\.168\./,                      // Class C private
  /^169\.254\./,                     // Link-local
  /^0\./,                            // Current network
  /^224\./,                          // Multicast
  /^240\./,                          // Reserved
  /^localhost$/i,                    // Localhost hostname
  /^.*\.local$/i,                    // Local domain
];

/**
 * Validates if a URL is allowed for tracking redirects
 * @param url - The URL to validate
 * @returns true if URL is safe, false otherwise
 */
function isUrlAllowed(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Only allow HTTPS URLs
    if (parsedUrl.protocol !== 'https:') {
      logger.debug('URL rejected: non-HTTPS protocol', { url, protocol: parsedUrl.protocol });
      return false;
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Reject localhost and private hostnames
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        logger.debug('URL rejected: private/reserved hostname', { url, hostname });
        return false;
      }
    }

    // Check if hostname is in allowed list or is a subdomain of an allowed domain
    const isAllowed = ALLOWED_TRACK_DOMAINS.some((allowedDomain) => {
      return hostname === allowedDomain || hostname.endsWith('.' + allowedDomain);
    });

    if (!isAllowed) {
      logger.debug('URL rejected: hostname not in allowlist', { url, hostname, allowedDomains: ALLOWED_TRACK_DOMAINS });
    }

    return isAllowed;
  } catch (error) {
    logger.debug('URL rejected: invalid URL format', { url, error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

class AutomationServer {
  private app: Application;
  private server: ReturnType<Application['listen']> | null = null;
  private mongoConnection: typeof import('mongoose') | null = null;

  constructor() {
    // Validate environment before any initialization
    validateEnv();
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for API service
    }));

    // CORS
    this.app.use(cors({
      origin: (() => {
        const origins = process.env.CORS_ORIGIN?.split(',') || [];
        if (origins.includes('*')) {
          throw new Error('Wildcard CORS origin forbidden in production');
        }
        return origins.length > 0 ? origins : ['http://localhost:3000'];
      })(),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.debug('Incoming request', {
        method: req.method,
        path: req.path,
        query: req.query,
      });
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Root health check
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        service: 'rez-automation-service',
        version: '1.0.0',
        status: 'running',
        port: PORT,
        timestamp: new Date().toISOString(),
      });
    });

    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        service: 'rez-automation-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // API routes
    this.app.use('/api', automationRoutes);

    // Email tracking endpoints
    this.app.get('/track/open', async (req: Request, res: Response) => {
      const { message_id, campaign } = req.query;
      if (message_id) {
        await emailService.trackOpen(message_id as string, campaign as string);
      }
      // Return 1x1 transparent GIF
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    });

    this.app.get('/track/click', (req: Request, res: Response) => {
      const { url, message_id, campaign } = req.query;
      if (!url) {
        res.status(400).json({ error: 'URL required' });
        return;
      }

      const decodedUrl = decodeURIComponent(url as string);

      // SECURITY: Validate URL against allowlist before redirect (open redirect prevention)
      if (!isUrlAllowed(decodedUrl)) {
        logger.warn('Blocked open redirect attempt', { url: decodedUrl, ip: req.ip });
        res.status(400).json({ error: 'Redirect URL not allowed' });
        return;
      }

      if (message_id) {
        emailService.trackClick(message_id as string, decodedUrl, campaign as string);
      }

      // Redirect to validated URL
      res.redirect(decodedUrl);
    });

    // Unsubscribe endpoint
    this.app.get('/unsubscribe', async (req: Request, res: Response) => {
      const { token, channel, email } = req.query;
      if (token && channel === 'email' && email) {
        const result = await emailService.handleUnsubscribe(email as string, 'User clicked unsubscribe link');
        res.json({ success: result.success, message: result.message });
      } else {
        res.status(400).json({ error: 'Invalid unsubscribe parameters' });
      }
    });

    // SMS status callback (Twilio)
    this.app.post('/sms/status', express.urlencoded({ extended: false }), async (req: Request, res: Response) => {
      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;
      await smsService.handleStatusCallback(MessageSid, MessageStatus, ErrorCode, ErrorMessage);
      res.sendStatus(200);
    });

    // SMS incoming webhook (Twilio)
    this.app.post('/sms/incoming', express.urlencoded({ extended: false }), async (req: Request, res: Response) => {
      const { From, To, Body, MessageSid } = req.body;
      const result = await smsService.handleIncomingSMS(From, To, Body, MessageSid);

      // Respond with appropriate TwiML
      if (result.action === 'unsubscribed') {
        res.set('Content-Type', 'text/xml');
        res.send('<Response></Response>');
      } else if (result.action === 'help') {
        res.set('Content-Type', 'text/xml');
        res.send(`<Response><Message>${result.message}</Message></Response>`);
      } else {
        res.sendStatus(200);
      }
    });

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
      });
    });
  }

  /**
   * Initialize services
   */
  private async initializeServices(): Promise<void> {
    logger.info('Initializing services...');

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
    try {
      const mongoose = await import('mongoose');
      this.mongoConnection = mongoose;
      await mongoose.connect(MONGODB_URI);
      logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to connect to MongoDB', { error: errorMessage });
      throw error;
    }

    // Initialize email service
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASS || '',
      from: process.env.EMAIL_FROM || 'ReZ Automation <noreply@rezapp.com>',
    };

    if (smtpConfig.user && smtpConfig.password) {
      await emailService.initialize(smtpConfig);
    } else {
      // Use test account for development
      await emailService.initializeWithTestAccount();
      logger.warn('Using test email account - set SMTP credentials for production');
    }

    // Initialize SMS service
    const smsConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    };

    if (smsConfig.accountSid && smsConfig.authToken) {
      await smsService.initialize(smsConfig);
    } else {
      logger.warn('Twilio credentials not configured - SMS sending will use mock mode');
      await smsService.initialize({
        accountSid: 'mock',
        authToken: 'mock',
        phoneNumber: '+1234567890',
      });
    }

    // Start automation worker
    await automationWorker.start();

    logger.info('All services initialized successfully');
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      logger.info('Starting ReZ Automation Service...');

      // Initialize all services
      await this.initializeServices();

      // Start HTTP server
      this.server = this.app.listen(PORT, () => {
        logger.info(`Server started on port ${PORT}`, {
          nodeEnv: process.env.NODE_ENV || 'development',
          port: PORT,
          mongodb: MONGODB_URI.replace(/\/\/.*@/, '//***@'),
        });
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to start server', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        // Stop accepting new connections
        if (this.server) {
          await new Promise<void>((resolve) => {
            this.server!.close(() => {
              logger.info('HTTP server closed');
              resolve();
            });
          });
        }

        // Stop automation worker
        await automationWorker.stop();

        // Close email service
        await emailService.close();

        // Close SMS service
        await smsService.close();

        // Disconnect from MongoDB
        if (this.mongoConnection) {
          await this.mongoConnection.disconnect();
          logger.info('Disconnected from MongoDB');
        }

        logger.info('Graceful shutdown completed');
        process.exit(0);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error during shutdown', { error: errorMessage });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason });
      shutdown('unhandledRejection');
    });
  }

  /**
   * Stop the server
   */
  public async stop(): Promise<void> {
    if (!this.server) {
      logger.warn('Server is not running');
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get Express app instance (for testing)
   */
  public getApp(): Application {
    return this.app;
  }
}

// Create and start application
const app = new AutomationServer();

// Start the server
app.start().catch((error) => {
  logger.error('Failed to start application', { error: error.message });
  process.exit(1);
});

export default app;

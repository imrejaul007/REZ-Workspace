import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
import * as express from 'express';
import helmet from 'helmet';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { getHttpsConfig, securityHeaders } from './config/https.config';
import { SecurityModule } from './common/modules/security.module';

async function bootstrap() {
  // Configure Winston logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
            }`;
          }),
        ),
      }),
      // Log to file in production
      ...(process.env.NODE_ENV === 'production' ? [
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ] : []),
    ],
  });

  // Get HTTPS configuration
  const configService = new ConfigService();
  const httpsConfig = getHttpsConfig(configService);

  const app = await NestFactory.create(AppModule, {
    logger,
    httpsOptions: httpsConfig.enabled ? httpsConfig.options : undefined
  });

  const appConfigService = app.get(ConfigService);

  // Enable Socket.IO WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Trust proxy (for accurate IP addresses behind load balancers)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Apply security middleware early in the chain
  app.use(new SecurityMiddleware(appConfigService).use.bind(new SecurityMiddleware(appConfigService)));

  // Set additional security headers
  const environment = appConfigService.get('NODE_ENV', 'development');
  Object.entries(SecurityModule.getSecurityHeaders(environment)).forEach(([key, value]) => {
    expressApp.use((req, res, next) => {
      res.setHeader(key, value);
      next();
    });
  });

  // Enhanced Rate limiting with security-focused configuration
  const limiter = rateLimit({
    windowMs: appConfigService.get('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes by default
    max: appConfigService.get('RATE_LIMIT_MAX_REQUESTS', process.env.NODE_ENV === 'production' ? 100 : 1000),
    message: {
      error: 'Too many requests from this IP. Please try again later.',
      statusCode: 429,
      retryAfter: Math.ceil(appConfigService.get('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000) / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Enhanced logging for security monitoring using modern handler
    handler: (req, res, next, options) => {
      // Check if this is the first request to exceed the limit (equivalent to onLimitReached)
      if (req.rateLimit.used === req.rateLimit.limit + 1) {
        logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
      }
      res.status(options.statusCode).send(options.message);
    },
    // Skip rate limiting for health checks only in development
    skip: (req) => {
      if (process.env.NODE_ENV === 'development') {
        return req.path.includes('/health') && (req.ip === '127.0.0.1' || req.ip === '::1');
      }
      return false;
    },
  });
  app.use(limiter);

  // Strict rate limiting for authentication endpoints with progressive delays
  const authLimiter = rateLimit({
    windowMs: appConfigService.get('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
    max: appConfigService.get('AUTH_RATE_LIMIT_MAX_REQUESTS', process.env.NODE_ENV === 'development' ? 20 : 5),
    message: {
      error: 'Too many authentication attempts. Your IP has been temporarily blocked for security.',
      statusCode: 429,
      retryAfter: Math.ceil(appConfigService.get('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000) / 1000),
      blocked: true,
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Enhanced security logging for authentication attempts using modern handler
    handler: (req, res, next, options) => {
      // Check if this is the first request to exceed the limit (equivalent to onLimitReached)
      if (req.rateLimit.used === req.rateLimit.limit + 1) {
        logger.error(`SECURITY ALERT: Authentication rate limit exceeded`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
          severity: 'HIGH',
        });
      }
      res.status(options.statusCode).send(options.message);
    },
    // Progressive delay - exponential backoff for repeated violations
    skip: (req) => {
      // Only skip health checks in development
      if (process.env.NODE_ENV === 'development') {
        return req.path.includes('/health');
      }
      return false;
    },
  });

  // Extra strict rate limiting for sensitive auth operations
  const strictAuthLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Only 3 attempts per hour for password reset
    message: {
      error: 'Too many sensitive operations attempted. Please wait before trying again.',
      statusCode: 429,
      retryAfter: 3600,
      blocked: true,
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Enhanced security logging for sensitive auth operations using modern handler
    handler: (req, res, next, options) => {
      // Check if this is the first request to exceed the limit (equivalent to onLimitReached)
      if (req.rateLimit.used === req.rateLimit.limit + 1) {
        logger.error(`SECURITY ALERT: Sensitive auth operation rate limit exceeded`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
          severity: 'CRITICAL',
        });
      }
      res.status(options.statusCode).send(options.message);
    },
  });

  // Apply different rate limits to different auth endpoints
  app.use('/api/v1/auth', authLimiter);
  app.use('/api/v1/auth/forgot-password', strictAuthLimiter);
  app.use('/api/v1/auth/reset-password', strictAuthLimiter);
  app.use('/api/v1/auth/change-password', strictAuthLimiter);

  // Security headers with Helmet
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'https://api.stripe.com', 'https://api.razorpay.com'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Body size limits
  app.use('/api/v1/upload', express.raw({ limit: '50mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Enhanced Compression with smart filtering and performance optimizations
  app.use(compression({
    filter: (req, res) => {
      // Skip compression if explicitly requested
      if (req.headers['x-no-compression']) {
        return false;
      }

      // Skip compression for real-time endpoints (WebSocket upgrades, SSE)
      if (req.headers.upgrade || req.headers['accept'] === 'text/event-stream') {
        return false;
      }

      // Skip compression for already compressed content types
      const contentType = res.getHeader('content-type') || '';
      const skipTypes = [
        'image/', 'video/', 'audio/', 'application/pdf',
        'application/zip', 'application/gzip', 'application/x-rar'
      ];

      if (skipTypes.some(type => contentType.toString().includes(type))) {
        return false;
      }

      // Skip compression for very small responses (overhead not worth it)
      const contentLength = res.getHeader('content-length');
      if (contentLength && parseInt(contentLength.toString()) < 500) {
        return false;
      }

      return compression.filter(req, res);
    },
    level: process.env.NODE_ENV === 'production' ? 6 : 4, // Higher compression in production
    threshold: 500, // Compress responses larger than 500 bytes
    chunkSize: 1024 * 16, // 16KB chunks for better performance
    windowBits: 15, // Maximum window size for better compression ratio
    memLevel: 8, // Balanced memory usage
    // strategy: compression.constants.Z_DEFAULT_STRATEGY, // Commented out due to compatibility issues
  }));

  // CORS with environment-specific configuration
  const corsOrigin = appConfigService.get('CORS_ORIGIN', '');
  const allowedOriginsEnv = appConfigService.get('ALLOWED_ORIGINS', '');
  const frontendUrl = appConfigService.get('FRONTEND_URL', '');
  // Hardcoded production origins — always allowed regardless of env vars
  const PRODUCTION_ORIGINS = [
    'https://restaurantapp-olive.vercel.app',
    'https://restopapa.vercel.app',
    'https://restopapa.com',
    'https://www.restopapa.com',
  ];

  const allowedOrigins = [
    ...PRODUCTION_ORIGINS,
    ...corsOrigin.split(',').filter(Boolean),
    ...allowedOriginsEnv.split(',').filter(Boolean),
    ...(frontendUrl ? [frontendUrl] : []),
    ...(process.env.NODE_ENV !== 'production' ? [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
    ] : []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  // CORS Origin validation - allow requests with no origin only in non-production
  const isProduction = process.env.NODE_ENV === 'production';
  const knownNoOriginClients = ['Postman', 'Thunder Client', 'insomnia']; // Tools that don't send Origin header

  app.enableCors({
    origin: (origin, callback) => {
      // Block all no-origin requests in production (security risk)
      if (!origin) {
        const userAgent = (global as unknown).req?.headers?.['user-agent'] || '';
        // Only allow known tools in development
        if (!isProduction && knownNoOriginClients.some(t => userAgent.includes(t))) {
          return callback(null, true);
        }
        // In production, reject no-origin requests (could be security risk)
        if (isProduction) {
          logger.warn(`CORS blocked no-origin request from IP: ${(global as unknown).req?.ip || 'unknown'}`);
          return callback(new Error('Not allowed by CORS: missing origin header'));
        }
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow localhost for convenience
      if (!isProduction && origin?.includes('localhost')) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'X-API-Key',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  });

  // CSRF Protection (configurable via environment)
  const enableCsrf = appConfigService.get('ENABLE_CSRF', 'false') === 'true';
  if (enableCsrf) {
    app.use(csurf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      },
      // Ignore CSRF for API documentation and health checks
      ignoreMethods: process.env.NODE_ENV === 'development' ? ['GET', 'HEAD', 'OPTIONS'] : ['GET', 'HEAD'],
    }));

    // Provide CSRF token endpoint
    expressApp.get('/api/v1/csrf-token', (req, res) => {
      res.json({ csrfToken: req.csrfToken() });
    });
  }

  // Global prefix
  app.setGlobalPrefix(appConfigService.get('API_PREFIX', 'api/v1'));

  // Request logging (configurable for different environments)
  if (appConfigService.get('LOG_LEVEL') === 'debug') {
    app.use((req, res, next) => {
      if (logger) {
        logger.log(`${req.method} ${req.path}`, JSON.stringify({
          method: req.method,
          path: req.path,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          // Never log sensitive data like passwords or tokens
          bodySize: req.body ? JSON.stringify(req.body).length : 0,
          timestamp: new Date().toISOString(),
        }));
      }
      next();
    });
  } else {
    // Minimal logging for production
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.path !== '/api/v1/health') {
        logger.log(`${req.method} ${req.path}`, { ip: req.ip });
      }
      next();
    });
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Prisma shutdown hook - enabling app shutdown hooks
  app.enableShutdownHooks();

  // Enhanced Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('RestoPapa API')
    .setDescription(`
      The RestoPapa API - Complete B2B/B2C SaaS platform for the restaurant industry.
      
      Features:
      - Multi-role authentication (Admin, Restaurant, Vendor, Employee, Customer)
      - Restaurant management and operations
      - B2B marketplace with vendor integration
      - Job portal and HR management
      - Real-time messaging and notifications
      - Payment processing and billing
      - Analytics and reporting
      - Training and certification system
      
      For support, contact: support@restopapa.com
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for external integrations',
      },
      'api-key',
    )
    .addServer('http://localhost:3000/api/v1', 'Development server')
    .addServer('https://api.restopapa.com/api/v1', 'Production server')
    .addTag('auth', 'Authentication and authorization')
    .addTag('users', 'User profile management')
    .addTag('restaurants', 'Restaurant operations and management')
    .addTag('vendors', 'Vendor and supplier management')
    .addTag('employees', 'Employee management and HR')
    .addTag('jobs', 'Job portal and applications')
    .addTag('marketplace', 'B2B product marketplace')
    .addTag('orders', 'Order management and fulfillment')
    .addTag('payments', 'Payment processing and billing')
    .addTag('financial', 'Financial management, invoicing, and accounting')
    .addTag('inventory', 'Inventory and stock management')
    .addTag('menu', 'Menu management and pricing')
    .addTag('pos', 'Point of Sale and table management')
    .addTag('customer', 'Customer relationship management')
    .addTag('messaging', 'Real-time messaging system')
    .addTag('notifications', 'Notification management')
    .addTag('analytics', 'Analytics and reporting')
    .addTag('admin', 'Administrative operations')
    .addTag('files', 'File upload and management')
    .addTag('support', 'Customer support system')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    customSiteTitle: 'RestoPapa API Documentation',
    customfavIcon: '/favicon.ico',
  });

  // Global error handling
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (reason instanceof Error) {
      logger.error('Error stack:', reason.stack);
      logger.error('Error message:', reason.message);
    } else {
      logger.error('Non-error reason:', JSON.stringify(reason, null, 2));
    }
    // Exit with proper error code after logging
    process.exit(1);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    logger.log(`Received ${signal}. Shutting down gracefully...`);

    app.close().then(async () => {
      logger.log('HTTP server closed.');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  const port = appConfigService.get('API_PORT', 3000);
  const host = appConfigService.get('API_HOST', '0.0.0.0');
  
  await app.listen(port, host);

  const baseUrl = `http://${host}:${port}`;
  const apiPrefix = appConfigService.get('API_PREFIX', 'api/v1');
  
  logger.log(`🚀 RestoPapa API is running!`);
  logger.log(`📊 API Endpoint: ${baseUrl}/${apiPrefix}`);
  logger.log(`📚 Documentation: ${baseUrl}/docs`);
  logger.log(`🔧 Health Check: ${baseUrl}/${apiPrefix}/health`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`📈 Rate Limit: ${appConfigService.get('RATE_LIMIT_MAX', 1000)} requests per 15 minutes`);
  logger.log(`🔐 Security: CORS, Helmet, Rate Limiting ${process.env.NODE_ENV === 'production' ? '+ CSRF' : ''}`);
}

bootstrap();
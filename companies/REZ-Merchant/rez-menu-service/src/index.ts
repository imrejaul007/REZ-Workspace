import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import menuRoutes from './routes/menu.routes';

const app: Express = express();
const PORT = 4030;

// =============================================================================
// SECURITY: Environment Configuration
// =============================================================================
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-menu';
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// =============================================================================
// SECURITY: Authentication Middleware
// =============================================================================
interface MerchantAuthRequest extends Request {
  merchantId?: string;
  restaurantId?: string;
}

const merchantAuth = async (req: MerchantAuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is required',
        },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bearer token is required',
        },
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      merchantId: string;
      restaurantId: string;
      iat: number;
      exp: number;
    };

    // Validate token payload
    if (!decoded.merchantId || !decoded.restaurantId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token is missing required claims',
        },
      });
    }

    // Attach merchant info to request
    req.merchantId = decoded.merchantId;
    req.restaurantId = decoded.restaurantId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authorization token has expired',
        },
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authorization token',
        },
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
};

// =============================================================================
// SECURITY: CORS Configuration
// =============================================================================
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
      console.warn(`CORS rejected origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }

    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

// =============================================================================
// SECURITY: Rate Limiting
// =============================================================================
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/v1/health' || req.path === '/';
  },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Stricter limit for auth operations
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================================================
// Middleware Pipeline
// =============================================================================
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalRateLimiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    console.log(`[${logLevel.toUpperCase()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint (no auth required)
app.get('/api/v1/health', (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'rez-menu-service',
    version: '1.0.0',
    dependencies: {
      mongodb: mongoStatus,
    },
  });
});

// Apply authentication middleware to all menu routes
app.use('/api/v1', merchantAuth, menuRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'ReZ Menu Management Service',
    version: '1.0.0',
    description: 'Restaurant menu management with AI recommendations',
    security: {
      authentication: 'required',
      rateLimit: '100 requests per 15 minutes',
      cors: 'origin whitelist enabled',
    },
    endpoints: {
      health: '/api/v1/health',
      menus: '/api/v1/menus',
      categories: '/api/v1/menus/:menuId/categories',
      items: '/api/v1/menus/:menuId/items',
      recommendations: '/api/v1/recommendations',
      analytics: '/api/v1/menus/:menuId/analytics',
    },
    documentation: {
      createMenu: 'POST /api/v1/menus',
      getMenus: 'GET /api/v1/menus',
      getMenu: 'GET /api/v1/menus/:id',
      updateMenu: 'PATCH /api/v1/menus/:id',
      deleteMenu: 'DELETE /api/v1/menus/:id',
      publishMenu: 'POST /api/v1/menus/:id/publish',
      duplicateMenu: 'POST /api/v1/menus/:id/duplicate',
      menuStatistics: 'GET /api/v1/menus/:id/statistics',
      createCategory: 'POST /api/v1/menus/:menuId/categories',
      getCategories: 'GET /api/v1/menus/:menuId/categories',
      updateCategory: 'PATCH /api/v1/categories/:id',
      deleteCategory: 'DELETE /api/v1/menus/:menuId/categories/:categoryId',
      reorderCategories: 'POST /api/v1/menus/:menuId/categories/reorder',
      createItem: 'POST /api/v1/menus/:menuId/items',
      getItems: 'GET /api/v1/menus/:menuId/items',
      searchItems: 'GET /api/v1/menus/:menuId/search?q=query',
      getItem: 'GET /api/v1/items/:id',
      updateItem: 'PATCH /api/v1/items/:id',
      deleteItem: 'DELETE /api/v1/menus/:menuId/items/:itemId',
      addVariant: 'POST /api/v1/items/:itemId/variants',
      updateVariant: 'PATCH /api/v1/items/:itemId/variants/:variantId',
      deleteVariant: 'DELETE /api/v1/items/:itemId/variants/:variantId',
      addModifier: 'POST /api/v1/items/:itemId/modifiers',
      updateModifier: 'PATCH /api/v1/items/:itemId/modifiers/:modifierId',
      deleteModifier: 'DELETE /api/v1/items/:itemId/modifiers/:modifierId',
      toggleAvailability: 'POST /api/v1/availability',
      bulkToggleAvailability: 'POST /api/v1/availability/bulk',
      getAnalytics: 'GET /api/v1/menus/:menuId/analytics',
      getTopItems: 'GET /api/v1/menus/:menuId/analytics/top',
      getLowItems: 'GET /api/v1/menus/:menuId/analytics/low',
      recordView: 'POST /api/v1/items/:id/view',
      recordOrder: 'POST /api/v1/items/:id/order',
      getRecommendations: 'POST /api/v1/recommendations',
      getComplementary: 'GET /api/v1/items/:id/complementary',
      getBundles: 'POST /api/v1/menus/:menuId/bundles',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_FORBIDDEN',
        message: 'Origin not allowed',
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    },
  });
});

// =============================================================================
// MongoDB Connection
// =============================================================================
const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// =============================================================================
// Graceful Shutdown
// =============================================================================
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received. Shutting down gracefully...`);

  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

// =============================================================================
// Start Server
// =============================================================================
let server: ReturnType<typeof app.listen>;

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    server = 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-menu-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   ReZ Menu Management Service                                 ║
║                                                                ║
║   Server running on port ${PORT}                               ║
║   API Base URL: http://localhost:${PORT}/api/v1                  ║
║   Health Check: http://localhost:${PORT}/api/v1/health          ║
║                                                                ║
║   Security Features:                                          ║
║   - JWT Authentication: ENABLED                                ║
║   - CORS: Origin whitelist restricted                          ║
║   - Rate Limiting: 100 requests/15 minutes                    ║
║   - MongoDB Storage: ENABLED                                   ║
║                                                                ║
║   Features:                                                    ║
║   - Restaurant menus with categories and items                ║
║   - Modifiers and variants support                            ║
║   - Availability toggle (menu/category/item level)             ║
║   - AI-powered recommendations                                 ║
║   - Menu analytics                                            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

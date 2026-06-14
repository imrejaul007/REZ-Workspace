import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import axios from 'axios';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
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

// Service URLs configuration
const SERVICE_URLS = {
  // REZ-Mart internal services
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:4104',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:4105',
  cart: process.env.CART_SERVICE_URL || 'http://localhost:4108',
  driver: process.env.DRIVER_SERVICE_URL || 'http://localhost:4101',
  tracking: process.env.TRACKING_SERVICE_URL || 'http://localhost:4102',
  store: process.env.STORE_SERVICE_URL || 'http://localhost:4103',
  delivery: process.env.DELIVERY_SERVICE_URL || 'http://localhost:4106',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:4107',
  offer: process.env.OFFER_SERVICE_URL || 'http://localhost:4109',
  subscription: process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:4110',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4112',
  // RABTUL services (Money Movement)
  auth: process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
  wallet: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
  payment: process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001',
  notifications: process.env.RABTUL_NOTIFICATIONS_URL || 'http://localhost:4007',
  // HOJAI AI services
  hojai: process.env.HOJAI_URL || 'http://localhost:4630',
  memory: process.env.HOJAI_MEMORY_URL || 'http://localhost:4540',
  // REZ Intelligence
  intelligence: process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4100',
  // KHAIRMOVE (Delivery)
  khaimove: process.env.KHAIRMOVE_URL || 'http://localhost:4603'
};

// JWT Auth Middleware - integrates with RABTUL Auth Service
const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const token = authHeader.substring(7);

    // Integrate with RABTUL Auth Service (port 4002)
    try {
      const response = await axios.post(`${SERVICE_URLS.auth}/api/auth/validate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      (req as any).user = response.data;
      (req as any).userId = response.data.userId || response.data.id;
      next();
    } catch (authError: any) {
      // Fallback to JWT verification for development (requires JWT_SECRET env var)
      if (process.env.NODE_ENV === 'development') {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          res.status(500).json({ error: 'JWT_SECRET environment variable required for development' });
          return;
        }
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, jwtSecret);
          (req as any).user = decoded;
          (req as any).userId = decoded.userId || decoded.sub;
          next();
        } catch {
          res.status(401).json({ error: 'Invalid token' });
          return;
        }
      } else {
        logger.error('RABTUL Auth error:', authError.message);
        res.status(401).json({ error: 'Authentication failed' });
        return;
      }
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Request proxy helper
const proxyRequest = async (
  targetUrl: string,
  req: Request,
  res: Response,
  options: { requireAuth?: boolean } = {}
): Promise<void> => {
  try {
    const config: any = {
      method: req.method,
      url: `${targetUrl}${req.originalUrl}`,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization })
      },
      data: req.body,
      timeout: 30000
    };

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      logger.error('Proxy request error:', error);
      res.status(502).json({ error: 'Service unavailable' });
    }
  }
};

// Create Express app
const app = express();
const PORT = process.env.PORT || 4100;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: 'rez-mart-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes - Product Service
app.get('/api/products', (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.product, req, res)
);
app.get('/api/products/search', (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.product, req, res)
);
app.get('/api/products/recommendations', authMiddleware, (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.product, req, res)
);
app.get('/api/products/:id', (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.product, req, res)
);

// API routes - Cart Service
app.get('/api/cart', authMiddleware, (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.cart, req, res)
);
app.post('/api/cart/items', authMiddleware, (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.cart, req, res)
);
app.patch('/api/cart/items/:id', authMiddleware, (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.cart, req, res)
);
app.delete('/api/cart/items/:id', authMiddleware, (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.cart, req, res)
);

// API routes - Order Service
app.get('/api/orders', authMiddleware, (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.order, req, res)
);
app.get('/api/orders/:id', authMiddleware, (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.order, req, res)
);
app.post('/api/orders', authMiddleware, (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.order, req, res)
);
app.patch('/api/orders/:id/cancel', authMiddleware, (req: Request, res: Response) =>
  proxyRequest(SERVICE_URLS.order, req, res)
);

// Checkout endpoint - integrates cart, order, and wallet
app.post('/api/checkout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { cartId, paymentMethod } = req.body;

    // Step 1: Get cart items
    const cartResponse = await axios.get(`${SERVICE_URLS.cart}/cart`, {
      headers: { Authorization: req.headers.authorization }
    });
    const cartItems = cartResponse.data.items || [];

    if (cartItems.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    // Step 2: Create order
    const orderData = {
      userId,
      items: cartItems,
      paymentMethod
    };
    const orderResponse = await axios.post(
      `${SERVICE_URLS.order}/orders`,
      orderData,
      { headers: { Authorization: req.headers.authorization } }
    );

    // Step 3: Process payment via RABTUL Wallet
    const paymentData = {
      userId,
      amount: orderResponse.data.total,
      currency: 'INR',
      orderId: orderResponse.data.id
    };

    try {
      await axios.post(
        `${SERVICE_URLS.wallet}/deduct`,
        paymentData,
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (walletError: any) {
      // Rollback order if payment fails
      await axios.patch(
        `${SERVICE_URLS.order}/orders/${orderResponse.data.id}/cancel`,
        { reason: 'Payment failed' },
        { headers: { Authorization: req.headers.authorization } }
      );
      res.status(400).json({ error: 'Payment failed', details: walletError.response?.data });
      return;
    }

    // Step 4: Clear cart
    await axios.delete(`${SERVICE_URLS.cart}/cart`, {
      headers: { Authorization: req.headers.authorization }
    });

    res.status(201).json({
      order: orderResponse.data,
      payment: 'completed'
    });
  } catch (error: any) {
    logger.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed', details: error.message });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`REZ-Mart Gateway running on port ${PORT}`);
  logger.info(`Product Service: ${SERVICE_URLS.product}`);
  logger.info(`Order Service: ${SERVICE_URLS.order}`);
  logger.info(`Cart Service: ${SERVICE_URLS.cart}`);
  logger.info(`Auth Service: ${SERVICE_URLS.auth}`);
  logger.info(`Wallet Service: ${SERVICE_URLS.wallet}`);
});

export default app;

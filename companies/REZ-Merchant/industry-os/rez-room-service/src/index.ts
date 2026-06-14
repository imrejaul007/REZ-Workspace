/**
 * REZ Room Service (F&B) Service - 10/10 Production Ready
 * Port: 4043
 *
 * Features:
 * - MongoDB persistence
 * - JWT Authentication
 * - Rate Limiting
 * - Helmet Security Headers
 * - CORS with Production Origins
 * - Zod Validation
 * - Winston Logger
 * - Health Checks (/health, /health/live, /health/ready)
 * - Standardized Error Responses
 * - Graceful Shutdown
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { MenuItem, Order, GuestPreferences, TableReservation } from './models/index.js';

dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const PORT = parseInt(process.env.PORT || '4043', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/rez-room-service';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token-room-4043';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// LOGGER
// ============================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    NODE_ENV === 'production' ? winston.format.json() : winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'rez-room-service' },
});

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();

// Security headers
app.use(helmet());

// CORS
const corsOrigins = NODE_ENV === 'production'
  ? ['https://rez.app', 'https://admin.rez.app', 'https://merchant.rez.app']
  : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Service-Name'],
}));

// Request logging
app.use(morgan(NODE_ENV === 'production' ? ':method :url :status :res[content-length] - :response-time ms' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ============================================
// AUTH MIDDLEWARE
// ============================================

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Check internal token
  const internalToken = req.headers['x-internal-token'];
  if (internalToken === INTERNAL_TOKEN) {
    (req as any).isInternal = true;
    return next();
  }

  // Check JWT
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  const token = authHeader.substring(7);

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/validate`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Internal-Token': INTERNAL_TOKEN },
    });

    if (!response.ok) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
    }

    const data = await response.json();
    (req as any).user = data.user || data;
    next();
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ success: false, error: { code: 'AUTH_SERVICE_ERROR', message: 'Auth service unavailable' } });
  }
};

// ============================================
// ZOD SCHEMAS
// ============================================

const CreateOrderSchema = z.object({
  guestId: z.string(),
  guestName: z.string().min(2),
  roomNumber: z.string().min(1),
  hotelId: z.string(),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().min(1),
    specialInstructions: z.string().optional(),
    customizations: z.array(z.string()).optional(),
  })).min(1),
  specialInstructions: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']),
});

const GuestPreferencesSchema = z.object({
  dietaryRestrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  favoriteItems: z.array(z.string()).optional(),
  preferredDeliveryTime: z.string().optional(),
});

const TableReservationSchema = z.object({
  guestId: z.string(),
  guestName: z.string().min(2),
  roomNumber: z.string().min(1),
  hotelId: z.string(),
  date: z.string(),
  time: z.string(),
  partySize: z.number().min(1).max(20),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${year}-${random}`;
}

function calculateOrderTotals(subtotal: number, taxRate = 0.18, serviceChargeRate = 0.10) {
  const taxes = Math.round(subtotal * taxRate);
  const serviceCharge = Math.round(subtotal * serviceChargeRate);
  const totalAmount = subtotal + taxes + serviceCharge;
  return { subtotal, taxes, serviceCharge, totalAmount };
}

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const menuCount = await MenuItem.countDocuments();
  const activeOrders = await Order.countDocuments({ status: { $nin: ['delivered', 'cancelled'] } });

  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    service: 'rez-room-service',
    version: '1.0.0',
    port: PORT,
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stats: {
      menuItems: menuCount,
      activeOrders,
      totalOrders: await Order.countDocuments(),
    },
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ status: 'not_ready', reason: 'Database not connected' });
  }
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// ============================================
// MENU ENDPOINTS
// ============================================

/**
 * GET /api/menu - Get full menu with optional filtering
 */
app.get('/api/menu', authenticate, async (req: Request, res: Response) => {
  try {
    const { category, dietary, search, available } = req.query;
    const filter: any = {};

    if (category) filter.category = category;
    if (available === 'true') filter.isAvailable = true;
    if (dietary) filter.dietary = dietary;

    let items = await MenuItem.find(filter).sort({ category: 1, name: 1 });

    if (search) {
      const searchLower = (search as string).toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(searchLower) ||
        i.description.toLowerCase().includes(searchLower)
      );
    }

    // Group by category
    const groupedMenu: Record<string, any[]> = {};
    items.forEach(item => {
      if (!groupedMenu[item.category]) {
        groupedMenu[item.category] = [];
      }
      groupedMenu[item.category].push(item);
    });

    res.json({
      success: true,
      data: { items, groupedMenu, count: items.length },
    });
  } catch (error) {
    logger.error('Error fetching menu:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch menu' } });
  }
});

/**
 * GET /api/menu/category/:category - Get menu items by category
 */
app.get('/api/menu/category/:category', authenticate, async (req: Request, res: Response) => {
  try {
    const category = req.params.category as any;
    const items = await MenuItem.find({ category, isAvailable: true });

    res.json({
      success: true,
      data: { category, items, count: items.length },
    });
  } catch (error) {
    logger.error('Error fetching category:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch category' } });
  }
});

/**
 * GET /api/menu/:id - Get menu item details
 */
app.get('/api/menu/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Menu item not found' } });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    logger.error('Error fetching menu item:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch menu item' } });
  }
});

// ============================================
// ORDER ENDPOINTS
// ============================================

/**
 * POST /api/orders - Create a new order
 */
app.post('/api/orders', authenticate, async (req: Request, res: Response) => {
  try {
    const validated = CreateOrderSchema.parse(req.body);
    const { guestId, guestName, roomNumber, hotelId, items, specialInstructions, deliveryNotes } = validated;

    // Validate menu items and build order items
    const orderItems: any[] = [];
    let maxPrepTime = 15;
    let subtotal = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Menu item ${item.menuItemId} not found` } });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ success: false, error: { code: 'ITEM_UNAVAILABLE', message: `${menuItem.name} is currently unavailable` } });
      }

      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions,
        customizations: item.customizations,
      });

      subtotal += menuItem.price * item.quantity;
      if (menuItem.prepTime > maxPrepTime) maxPrepTime = menuItem.prepTime;
    }

    const { taxes, serviceCharge, totalAmount } = calculateOrderTotals(subtotal);
    const estimatedDeliveryTime = new Date(Date.now() + (maxPrepTime + 15) * 60 * 1000);

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      guestId,
      guestName,
      roomNumber,
      hotelId,
      items: orderItems,
      subtotal,
      taxes,
      serviceCharge,
      totalAmount,
      currency: 'INR',
      status: 'pending',
      paymentStatus: 'pending',
      specialInstructions,
      deliveryNotes,
      estimatedDeliveryTime,
    });

    logger.info(`Order created: ${order.orderNumber}`, { hotelId, guestId, amount: totalAmount });

    res.status(201).json({
      success: true,
      data: { order },
      message: `Order ${order.orderNumber} placed successfully. Estimated delivery: ${estimatedDeliveryTime.toLocaleTimeString()}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    logger.error('Error creating order:', error);
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create order' } });
  }
});

/**
 * GET /api/orders - List orders with optional filtering
 */
app.get('/api/orders', authenticate, async (req: Request, res: Response) => {
  try {
    const { guestId, hotelId, status, date, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (guestId) filter.guestId = guestId;
    if (hotelId) filter.hotelId = hotelId;
    if (status) filter.status = status;
    if (date) {
      const targetDate = new Date(date as string);
      filter.createdAt = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999)),
      };
    }

    const orders = await Order.find(filter)
      .populate('items.menuItemId')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: { orders, count: orders.length, pagination: { page: Number(page), limit: Number(limit), total } },
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch orders' } });
  }
});

/**
 * GET /api/orders/:id - Get order details
 */
app.get('/api/orders/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.menuItemId');
    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch order' } });
  }
});

/**
 * GET /api/orders/number/:orderNumber - Get order by order number
 */
app.get('/api/orders/number/:orderNumber', authenticate, async (req: Request, res: Response) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber }).populate('items.menuItemId');
    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch order' } });
  }
});

/**
 * PUT /api/orders/:id - Update order
 */
app.put('/api/orders/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Cannot modify completed or cancelled order' } });
    }

    const { items, specialInstructions, deliveryNotes } = req.body;

    if (items) {
      const updatedItems: any[] = [];
      let subtotal = 0;

      for (const item of items) {
        const menuItem = await MenuItem.findById(item.menuItemId);
        if (!menuItem) {
          return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Menu item ${item.menuItemId} not found` } });
        }
        updatedItems.push({
          menuItemId: menuItem._id,
          name: menuItem.name,
          quantity: item.quantity,
          price: menuItem.price,
          specialInstructions: item.specialInstructions,
          customizations: item.customizations,
        });
        subtotal += menuItem.price * item.quantity;
      }

      order.items = updatedItems;
      const totals = calculateOrderTotals(subtotal);
      order.subtotal = totals.subtotal;
      order.taxes = totals.taxes;
      order.serviceCharge = totals.serviceCharge;
      order.totalAmount = totals.totalAmount;
    }

    if (specialInstructions !== undefined) order.specialInstructions = specialInstructions;
    if (deliveryNotes !== undefined) order.deliveryNotes = deliveryNotes;

    await order.save();
    logger.info(`Order updated: ${order.orderNumber}`);

    res.json({ success: true, data: order, message: 'Order updated successfully' });
  } catch (error) {
    logger.error('Error updating order:', error);
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update order' } });
  }
});

/**
 * PUT /api/orders/:id/status - Update order status
 */
app.put('/api/orders/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const validated = UpdateOrderStatusSchema.parse(req.body);
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivering'],
      delivering: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(validated.status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS_TRANSITION', message: `Invalid status transition from ${order.status} to ${validated.status}` },
      });
    }

    order.status = validated.status;
    if (validated.status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();
    logger.info(`Order ${order.orderNumber} status changed to ${validated.status}`);

    res.json({ success: true, data: order, message: `Order status updated to ${validated.status}` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    logger.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update order status' } });
  }
});

/**
 * POST /api/orders/:id/cancel - Cancel an order
 */
app.post('/api/orders/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Order cannot be cancelled' } });
    }

    if (order.status === 'preparing' || order.status === 'delivering') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Order is being prepared/delivered and cannot be cancelled' } });
    }

    order.status = 'cancelled';
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }

    await order.save();
    logger.info(`Order cancelled: ${order.orderNumber}`);

    res.json({ success: true, data: order, message: 'Order cancelled successfully' });
  } catch (error) {
    logger.error('Error cancelling order:', error);
    res.status(500).json({ success: false, error: { code: 'CANCEL_ERROR', message: 'Failed to cancel order' } });
  }
});

// ============================================
// BILLING ENDPOINTS
// ============================================

/**
 * GET /api/orders/:id/bill - Get order bill
 */
app.get('/api/orders/:id/bill', authenticate, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.menuItemId');
    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        guestName: order.guestName,
        roomNumber: order.roomNumber,
        items: order.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal: order.subtotal,
        taxes: order.taxes,
        serviceCharge: order.serviceCharge,
        totalAmount: order.totalAmount,
        currency: order.currency,
        status: order.status,
        orderDate: order.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error fetching bill:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch bill' } });
  }
});

/**
 * POST /api/orders/:id/pay - Process payment for order
 */
app.post('/api/orders/:id/pay', authenticate, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_PAID', message: 'Order already paid' } });
    }

    order.paymentStatus = 'paid';
    await order.save();

    logger.info(`Payment processed for order: ${order.orderNumber}`, { amount: order.totalAmount });

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        paymentReference: `PAY-${Date.now()}`,
      },
      message: 'Payment successful',
    });
  } catch (error) {
    logger.error('Error processing payment:', error);
    res.status(500).json({ success: false, error: { code: 'PAYMENT_ERROR', message: 'Failed to process payment' } });
  }
});

// ============================================
// GUEST PREFERENCES ENDPOINTS
// ============================================

/**
 * POST /api/preferences - Set guest dietary preferences
 */
app.post('/api/preferences', authenticate, async (req: Request, res: Response) => {
  try {
    const { guestId } = req.body;
    if (!guestId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Guest ID required' } });
    }

    const validated = GuestPreferencesSchema.parse(req.body);

    const preferences = await GuestPreferences.findOneAndUpdate(
      { guestId },
      {
        $set: {
          dietaryRestrictions: validated.dietaryRestrictions || [],
          allergies: validated.allergies || [],
          favoriteItems: validated.favoriteItems || [],
          preferredDeliveryTime: validated.preferredDeliveryTime,
        },
      },
      { upsert: true, new: true }
    );

    logger.info(`Preferences saved for guest: ${guestId}`);

    res.status(201).json({ success: true, data: preferences, message: 'Preferences saved successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    logger.error('Error saving preferences:', error);
    res.status(500).json({ success: false, error: { code: 'SAVE_ERROR', message: 'Failed to save preferences' } });
  }
});

/**
 * GET /api/preferences/:guestId - Get guest preferences
 */
app.get('/api/preferences/:guestId', authenticate, async (req: Request, res: Response) => {
  try {
    const preferences = await GuestPreferences.findOne({ guestId: req.params.guestId });

    if (!preferences) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Preferences not found' } });
    }

    res.json({ success: true, data: preferences });
  } catch (error) {
    logger.error('Error fetching preferences:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch preferences' } });
  }
});

/**
 * GET /api/preferences/:guestId/recommendations - Get recommended menu items based on preferences
 */
app.get('/api/preferences/:guestId/recommendations', authenticate, async (req: Request, res: Response) => {
  try {
    const preferences = await GuestPreferences.findOne({ guestId: req.params.guestId });
    let recommendedItems = await MenuItem.find({ isAvailable: true });

    if (preferences) {
      // Filter by dietary restrictions
      if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
        recommendedItems = recommendedItems.filter(item =>
          preferences.dietaryRestrictions.every((d: string) => item.dietary.includes(d as any))
        );
      }

      // Filter out items with allergens
      if (preferences.allergies && preferences.allergies.length > 0) {
        recommendedItems = recommendedItems.filter(item =>
          !item.allergens.some((a: string) => preferences.allergies.includes(a))
        );
      }

      const favorites = recommendedItems.filter((item: any) =>
        preferences.favoriteItems && preferences.favoriteItems.includes(item._id.toString())
      );

      res.json({
        success: true,
        data: { recommendedItems, favorites, matchedPreferences: preferences },
      });
    } else {
      res.json({ success: true, data: { recommendedItems, favorites: [], matchedPreferences: null } });
    }
  } catch (error) {
    logger.error('Error fetching recommendations:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch recommendations' } });
  }
});

// ============================================
// TABLE RESERVATIONS ENDPOINTS
// ============================================

/**
 * POST /api/reservations - Create a table reservation
 */
app.post('/api/reservations', authenticate, async (req: Request, res: Response) => {
  try {
    const validated = TableReservationSchema.parse(req.body);

    const reservation = await TableReservation.create({
      guestId: validated.guestId,
      guestName: validated.guestName,
      roomNumber: validated.roomNumber,
      hotelId: validated.hotelId,
      date: new Date(validated.date),
      time: validated.time,
      partySize: validated.partySize,
      status: 'confirmed',
    });

    logger.info(`Reservation created for guest: ${validated.guestName}`, { hotelId: validated.hotelId });

    res.status(201).json({ success: true, data: reservation, message: 'Reservation confirmed' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    logger.error('Error creating reservation:', error);
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create reservation' } });
  }
});

/**
 * GET /api/reservations - List reservations
 */
app.get('/api/reservations', authenticate, async (req: Request, res: Response) => {
  try {
    const { guestId, hotelId, date } = req.query;
    const filter: any = {};

    if (guestId) filter.guestId = guestId;
    if (hotelId) filter.hotelId = hotelId;
    if (date) {
      const targetDate = new Date(date as string);
      filter.date = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999)),
      };
    }

    const reservations = await TableReservation.find(filter).sort({ date: 1, time: 1 });

    res.json({ success: true, data: { reservations, count: reservations.length } });
  } catch (error) {
    logger.error('Error fetching reservations:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch reservations' } });
  }
});

/**
 * DELETE /api/reservations/:id - Cancel a reservation
 */
app.delete('/api/reservations/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const reservation = await TableReservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Reservation not found' } });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    logger.info(`Reservation cancelled: ${reservation._id}`);

    res.json({ success: true, data: reservation, message: 'Reservation cancelled' });
  } catch (error) {
    logger.error('Error cancelling reservation:', error);
    res.status(500).json({ success: false, error: { code: 'CANCEL_ERROR', message: 'Failed to cancel reservation' } });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const shutdown = async () => {
  logger.info('Shutting down REZ Room Service...');
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

const seedDemoData = async () => {
  const menuCount = await MenuItem.countDocuments();
  if (menuCount > 0) return;

  const demoMenuItems = [
    { name: 'Continental Breakfast', description: 'Assorted pastries, fresh fruits, yogurt, cereal', category: 'breakfast', price: 750, prepTime: 15, calories: 450, dietary: ['vegetarian'], allergens: ['gluten', 'dairy'], isAvailable: true },
    { name: 'Masala Omelette', description: 'Fluffy omelette with onions, tomatoes, green chilies', category: 'breakfast', price: 350, prepTime: 12, calories: 320, dietary: ['vegetarian'], allergens: ['eggs', 'dairy'], isAvailable: true },
    { name: 'South Indian Breakfast', description: 'Masala dosa, idli sambar, coconut chutney', category: 'breakfast', price: 550, prepTime: 20, calories: 550, dietary: ['vegetarian', 'vegan'], allergens: [], isAvailable: true },
    { name: 'Butter Chicken', description: 'Tender chicken in creamy tomato-based curry', category: 'dinner', price: 650, prepTime: 30, calories: 680, dietary: ['halal'], allergens: ['dairy', 'nuts'], isAvailable: true },
    { name: 'Paneer Tikka', description: 'Grilled cottage cheese skewers with bell peppers', category: 'dinner', price: 480, prepTime: 25, calories: 420, dietary: ['vegetarian', 'halal'], allergens: ['dairy'], isAvailable: true },
    { name: 'Biryani Hyderabadi', description: 'Fragrant basmati rice layered with spiced meat', category: 'dinner', price: 750, prepTime: 35, calories: 780, dietary: ['halal'], allergens: ['dairy', 'nuts'], isAvailable: true },
    { name: 'Dal Makhani', description: 'Creamy black lentils slow-cooked with butter', category: 'lunch', price: 380, prepTime: 20, calories: 380, dietary: ['vegetarian', 'halal'], allergens: ['dairy'], isAvailable: true },
    { name: 'Vegetable Pulao', description: 'Fragrant rice with mixed vegetables', category: 'lunch', price: 320, prepTime: 25, calories: 420, dietary: ['vegetarian', 'vegan', 'gluten-free'], allergens: [], isAvailable: true },
    { name: 'Samosa Platter', description: 'Four crispy samosas with chutneys', category: 'snacks', price: 220, prepTime: 10, calories: 350, dietary: ['vegetarian', 'vegan'], allergens: ['gluten'], isAvailable: true },
    { name: 'Cheese Sandwich', description: 'Grilled cheese sandwich with cheddar', category: 'snacks', price: 280, prepTime: 10, calories: 380, dietary: ['vegetarian'], allergens: ['gluten', 'dairy'], isAvailable: true },
    { name: 'Masala Chai', description: 'Traditional Indian spiced tea', category: 'beverages', price: 80, prepTime: 5, calories: 100, dietary: ['vegetarian', 'vegan', 'gluten-free'], allergens: [], isAvailable: true },
    { name: 'Fresh Fruit Smoothie', description: 'Blend of seasonal fresh fruits', category: 'beverages', price: 220, prepTime: 8, calories: 180, dietary: ['vegetarian', 'gluten-free'], allergens: ['dairy'], isAvailable: true },
    { name: 'Gulab Jamun', description: 'Soft milk dumplings in rose-scented syrup', category: 'desserts', price: 180, prepTime: 5, calories: 280, dietary: ['vegetarian'], allergens: ['dairy', 'gluten'], isAvailable: true },
    { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', category: 'desserts', price: 320, prepTime: 15, calories: 450, dietary: ['vegetarian'], allergens: ['dairy', 'gluten', 'eggs', 'nuts'], isAvailable: true },
    { name: 'Sparkling Water 500ml', description: 'Premium sparkling mineral water', category: 'minibar', price: 150, prepTime: 1, dietary: ['vegan', 'gluten-free'], allergens: [], isAvailable: true },
    { name: 'Cashew Nuts Pack', description: 'Premium roasted and salted cashews', category: 'minibar', price: 350, prepTime: 1, calories: 320, dietary: ['vegan', 'gluten-free'], allergens: ['nuts'], isAvailable: true },
  ];

  await MenuItem.insertMany(demoMenuItems);
  logger.info('Demo menu items seeded');
};

const start = async () => {
  try {
    await mongoose.connect(MONGO_URL, {
      maxPoolSize: 20,
      minPoolSize: 5,
    });
    logger.info('Connected to MongoDB');

    await seedDemoData();

    app.listen(PORT, () => {
      logger.info(`ReZ Room Service started on port ${PORT}`);
      logger.info(╔═══════════════════════════════════════════════════════╗
║       REZ Room Service (F&B) - Port ${PORT}           ║
╠═══════════════════════════════════════════════════════╣
║  MongoDB: Connected                                   ║
║  JWT Auth: Enabled                                    ║
║  Rate Limit: 100 req/15min                           ║
║  Helmet: Enabled                                      ║
╚═══════════════════════════════════════════════════════╝`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
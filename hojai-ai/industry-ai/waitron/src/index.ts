/**
 * WAITRON - Restaurant AI Operating System
 * 10/10 Production Ready | Port: 4820
 * Integrated with: SDK, Webhooks, HOJAI Relationship OS
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { Restaurant, MenuItem, Order, Table, Reservation } from './models';
import { waitronAI, WaitronAIBrain } from './services/aiBrain';

// ExpertOS Integration - Clone your profession for online services
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'waitron' },
});

const PORT = parseInt(process.env.PORT || '4820', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/waitron';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090';
const HOJAI_URL = process.env.HOJAI_URL || 'http://localhost:4800';

// ============================================
// SDK & WEBHOOK HELPERS
// ============================================

async function triggerWebhook(event: string, payload: any) {
  try {
    await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/events`,
      { event, payload, source: 'waitron' },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Webhook triggered: ${event}`);
  } catch (error: any) {
    logger.error(`Webhook error (${event}):`, error.message);
  }
}

async function syncToHOJAI(entityType: string, action: string, data: any) {
  try {
    await axios.post(
      `${HOJAI_URL}/api/sync`,
      { entityType, action, source: 'waitron', data, timestamp: new Date().toISOString() },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Synced to HOJAI: ${entityType}/${action}`);
  } catch (error: any) {
    if (error.response?.status !== 404) {
      logger.error(`HOJAI sync error:`, error.message);
    }
  }
}

async function sendNotification(phone: string, message: string, channel: 'sms' | 'whatsapp' = 'sms') {
  try {
    const endpoint = channel === 'whatsapp' ? '/api/whatsapp/send' : '/api/sms/send';
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}${endpoint}`,
      channel === 'whatsapp' ? { to: phone, template: 'notification', variables: { message } } : { to: phone, message },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logger.error(`Notification error:`, error.message);
  }
}

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? ['https://hojai.ai'] : '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED' } } }));
app.use((req, res, next) => { logger.info(`${req.method} ${req.path}`); next(); });

interface AuthRequest extends Request { user?: any; isInternal?: boolean; }

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const internalToken = req.headers['x-internal-token'];
  if (internalToken === INTERNAL_TOKEN) { req.isInternal = true; return next(); }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/validate`, {
      headers: { Authorization: authHeader, 'X-Internal-Token': INTERNAL_TOKEN },
    });
    if (!response.ok) return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN' } });
    req.user = (await response.json()).user || (await response.json());
    next();
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ success: false, error: { code: 'AUTH_SERVICE_ERROR' } });
  }
};

// Health checks
app.get('/health', async (req, res) => {
  res.json({ status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded', service: 'waitron', version: '1.0.0', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', timestamp: new Date().toISOString(), uptime: process.uptime() });
});
app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ status: 'not_ready' });
  res.json({ status: 'ready' });
});

// AI Status
app.get('/ai/status', authenticate, (req, res) => {
  res.json({ success: true, data: { employees: [
    { id: 'ai-waiter', name: 'AI Waiter', status: 'active' },
    { id: 'ai-catering', name: 'Catering Manager', status: 'active' },
    { id: 'ai-kitchen', name: 'Kitchen Manager', status: 'active' },
    { id: 'ai-reservation', name: 'Reservation Manager', status: 'active' },
    { id: 'expert-os', name: 'ExpertOS', status: 'active', description: 'Professional AI Twin for chefs & restaurateurs' },
  ], uptime: process.uptime() } });
});

// Restaurants
app.post('/api/restaurants', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.create({ ...req.body, restaurantId: `REST-${Date.now().toString(36)}` });
    logger.info(`Restaurant created: ${restaurant.restaurantId}`);
    res.status(201).json({ success: true, data: restaurant });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find(req.query.city ? { city: req.query.city as string } : {}).sort({ name: 1 });
    res.json({ success: true, data: restaurants });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// Menu
app.post('/api/menu', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const item = await MenuItem.create({ ...req.body, itemId: `MENU-${Date.now().toString(36)}` });
    res.status(201).json({ success: true, data: item });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/menu/:restaurantId', async (req, res) => {
  try {
    const items = await MenuItem.find({ restaurantId: req.params.restaurantId, isAvailable: true }).sort({ category: 1, name: 1 });
    res.json({ success: true, data: items });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// Orders
app.post('/api/orders', async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId, customerPhone, customerName, items, orderType, tableNumber, deliveryAddress, notes } = req.body;
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = subtotal + tax;
    const orderId = `ORD-${Date.now().toString(36)}`;

    const order = await Order.create({
      orderId, restaurantId, customerPhone, customerName, items, subtotal, tax, discount: 0, total,
      currency: 'INR', status: 'pending', orderType: orderType || 'dine-in', tableNumber, deliveryAddress,
      paymentStatus: 'pending', notes,
    });

    logger.info(`Order created: ${orderId}`);

    // Trigger webhooks for order events
    await Promise.all([
      triggerWebhook('waitron.order.created', { orderId, restaurantId, customerPhone, total, status: 'pending' }),
      syncToHOJAI('order', 'created', { orderId, restaurantId, customerPhone, customerName, total, items }),
    ]);

    // Send confirmation notification
    if (customerPhone) {
      await sendNotification(customerPhone, `Order ${orderId} confirmed! Total: ₹${total.toFixed(2)}`);
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/orders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.restaurantId) filter.restaurantId = req.query.restaurantId;
    if (req.query.status) filter.status = req.query.status;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const orders = await Order.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 });
    const total = await Order.countDocuments(filter);
    res.json({ success: true, data: { orders, pagination: { page, limit, total } } });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

app.patch('/api/orders/:orderId/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const oldOrder = await Order.findOne({ orderId: req.params.orderId });
    const order = await Order.findOneAndUpdate({ orderId: req.params.orderId }, { $set: { status: req.body.status } }, { new: true });
    if (!order) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    logger.info(`Order ${order.orderId} status: ${req.body.status}`);

    // Trigger webhook for status change
    await Promise.all([
      triggerWebhook('waitron.order.status_changed', {
        orderId: order.orderId,
        restaurantId: order.restaurantId,
        oldStatus: oldOrder?.status,
        newStatus: req.body.status,
        customerPhone: order.customerPhone,
      }),
      syncToHOJAI('order', 'status_changed', {
        orderId: order.orderId,
        oldStatus: oldOrder?.status,
        newStatus: req.body.status,
      }),
    ]);

    // Notify customer on completion
    if (req.body.status === 'completed' && order.customerPhone) {
      await sendNotification(order.customerPhone, `Order ${order.orderId} is ready for pickup!`);
    }

    res.json({ success: true, data: order });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR' } }); }
});

// Reservations
app.post('/api/reservations', async (req: AuthRequest, res: Response) => {
  try {
    const reservation = await Reservation.create({ ...req.body, reservationId: `RESV-${Date.now().toString(36)}` });
    logger.info(`Reservation created: ${reservation.reservationId}`);
    res.status(201).json({ success: true, data: reservation });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/reservations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const reservations = await Reservation.find(req.query.restaurantId ? { restaurantId: req.query.restaurantId } : {}).sort({ date: 1, time: 1 });
    res.json({ success: true, data: reservations });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// Tables
app.post('/api/tables', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const table = await Table.create({ ...req.body, tableId: `TBL-${Date.now().toString(36)}` });
    res.status(201).json({ success: true, data: table });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/tables/:restaurantId', async (req, res) => {
  try {
    const tables = await Table.find({ restaurantId: req.params.restaurantId }).sort({ tableNumber: 1 });
    res.json({ success: true, data: tables });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// ============================================
// REAL AI ENDPOINTS - Claude-Powered
// ============================================

/**
 * POST /api/ai/waiter/understand
 * Parse natural language order into structured data
 * Input: { text: "I want a vegetarian pasta with extra cheese" }
 * Output: { items, dietary, specialRequests, confidence }
 */
app.post('/api/ai/waiter/understand', async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, error: { code: 'MISSING_TEXT' } });

    logger.info(`AI understanding order: "${text}"`);
    const parsed = await waitronAI.understandOrder(text);

    res.json({
      success: true,
      data: {
        parsed,
        message: `Understood ${parsed.items.length} item(s) with ${Math.round(parsed.confidence * 100)}% confidence`
      }
    });
  } catch (error) { logger.error('AI understand error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * POST /api/ai/waiter/recommend
 * Get personalized menu recommendations
 * Input: { restaurantId, preferences: { dietary, budget, occasion, previousOrders } }
 * Output: { recommendations, reasoning }
 */
app.post('/api/ai/waiter/recommend', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId, preferences } = req.body;
    if (!restaurantId) return res.status(400).json({ success: false, error: { code: 'MISSING_RESTAURANT' } });

    logger.info(`AI recommending for restaurant: ${restaurantId}`);
    const result = await waitronAI.recommendItems(restaurantId, preferences || {});

    res.json({
      success: true,
      data: {
        recommendations: result.recommendations.map(r => ({
          itemId: r.item.itemId,
          name: r.item.name,
          price: r.item.price,
          category: r.item.category,
          reason: r.reason,
          score: r.score
        })),
        reasoning: result.reasoning
      }
    });
  } catch (error) { logger.error('AI recommend error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * POST /api/ai/waiter/suggest-pairing
 * Suggest drink/food pairings for current order
 * Input: { restaurantId, items: ["Pasta", "Pizza"] }
 * Output: { pairings, reasoning }
 */
app.post('/api/ai/waiter/suggest-pairing', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId, items } = req.body;
    if (!restaurantId || !items?.length) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS' } });
    }

    logger.info(`AI suggesting pairings for: ${items.join(', ')}`);
    const result = await waitronAI.suggestPairing(restaurantId, items);

    res.json({
      success: true,
      data: {
        pairings: result.pairings.map(p => ({
          itemId: p.drink.itemId,
          name: p.drink.name,
          price: p.drink.price,
          reason: p.reason
        })),
        reasoning: result.reasoning
      }
    });
  } catch (error) { logger.error('AI pairing error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * POST /api/ai/waiter/analyze-sentiment
 * Analyze review sentiment
 * Input: { review: "The pasta was amazing but service was slow" }
 * Output: { sentiment, score, positives, negatives, summary }
 */
app.post('/api/ai/waiter/analyze-sentiment', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { review } = req.body;
    if (!review) return res.status(400).json({ success: false, error: { code: 'MISSING_REVIEW' } });

    logger.info(`AI analyzing sentiment for review`);
    const analysis = await waitronAI.analyzeSentiment(review);

    res.json({
      success: true,
      data: {
        sentiment: analysis.sentiment,
        score: analysis.score,
        positives: analysis.positives,
        negatives: analysis.negatives,
        summary: analysis.summary
      }
    });
  } catch (error) { logger.error('AI sentiment error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * POST /api/ai/waiter/upsell
 * Suggest upsells based on current order
 * Input: { restaurantId, items: ["Burger"], budget?: 500 }
 * Output: { suggestions, reasoning }
 */
app.post('/api/ai/waiter/upsell', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId, items, budget } = req.body;
    if (!restaurantId || !items?.length) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS' } });
    }

    logger.info(`AI suggesting upsells for: ${items.join(', ')}`);
    const result = await waitronAI.suggestUpsells(restaurantId, items, budget);

    res.json({
      success: true,
      data: {
        suggestions: result.suggestions.map(s => ({
          itemId: s.item.itemId,
          name: s.item.name,
          price: s.item.price,
          category: s.item.category,
          reason: s.reason
        })),
        reasoning: result.reasoning
      }
    });
  } catch (error) { logger.error('AI upsell error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * POST /api/ai/waiter/learn
 * Learn customer preferences from orders
 * Input: { userId, order }
 */
app.post('/api/ai/waiter/learn', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, order } = req.body;
    if (!userId || !order) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS' } });
    }

    logger.info(`AI learning preferences for user: ${userId}`);
    await waitronAI.learnPreference(userId, order);

    res.json({
      success: true,
      data: { message: 'Preferences learned successfully' }
    });
  } catch (error) { logger.error('AI learn error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * GET /api/ai/waiter/greet
 * Generate personalized greeting
 * Input: ?customerName=John&visitCount=5&lastOrder=Burger
 */
app.get('/api/ai/waiter/greet', async (req: AuthRequest, res: Response) => {
  try {
    const { customerName, visitCount, lastOrder } = req.query;
    if (!customerName) return res.status(400).json({ success: false, error: { code: 'MISSING_NAME' } });

    const greeting = await waitronAI.generateGreeting(
      customerName as string,
      parseInt(visitCount as string) || 0,
      lastOrder as string
    );

    res.json({
      success: true,
      data: { greeting }
    });
  } catch (error) { logger.error('AI greet error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

// ============================================
// EXISTING AI ENDPOINTS (Enhanced)
// ============================================

// AI Waiter
app.post('/api/ai/waiter/order', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId, customerPhone, items, orderType, notes } = req.body;
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const order = await Order.create({
      orderId: `ORD-${Date.now().toString(36)}`,
      restaurantId: restaurantId || 'default',
      customerPhone,
      items,
      subtotal,
      tax,
      discount: 0,
      total: subtotal + tax,
      currency: 'INR',
      status: 'pending',
      orderType: orderType || 'dine-in',
      paymentStatus: 'pending',
      notes,
    });
    logger.info(`AI Waiter created order: ${order.orderId}`);

    // Trigger webhook for AI-initiated order
    await Promise.all([
      triggerWebhook('waitron.order.ai_created', { orderId: order.orderId, restaurantId, customerPhone, total: order.total }),
      syncToHOJAI('order', 'ai_created', { orderId: order.orderId, source: 'ai-waiter', total: order.total }),
    ]);

    res.json({ success: true, data: { orderId: order.orderId, message: 'Order placed via AI Waiter' } });
  } catch (error) { logger.error('AI error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

app.get('/api/ai/waiter/recommend/:restaurantId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const items = await MenuItem.find({ restaurantId: req.params.restaurantId, isAvailable: true }).limit(5);
    res.json({ success: true, data: { recommendations: items.map(i => ({ itemId: i.itemId, name: i.name, price: i.price, reason: 'Popular choice' })) } });
  } catch (error) { logger.error('AI error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

// Analytics
app.get('/api/analytics/dashboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const filter: any = req.query.restaurantId ? { restaurantId: req.query.restaurantId } : {};
    const [totalOrders, todayOrders, revenue] = await Promise.all([
      Order.countDocuments(filter),
      Order.countDocuments({ ...filter, createdAt: { $gte: today } }),
      Order.aggregate([{ $match: { ...filter, createdAt: { $gte: today }, paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    ]);
    res.json({ success: true, data: { totalOrders, todayOrders, revenueToday: revenue[0]?.total || 0 } });
  } catch (error) { logger.error('Analytics error:', error); res.status(500).json({ success: false, error: { code: 'ANALYTICS_ERROR' } }); }
});

// ============================================
// EXPERTOS - Professional AI Twin for Chefs & Restaurant Owners
// ============================================

const expertOSRouter = registerExpertOS('waitron');
app.use('/api/expert-os', expertOSRouter);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => { logger.error('Unhandled error:', err); res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } }); });
app.use((req: Request, res: Response) => { res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } }); });

const shutdown = async () => { logger.info('Shutting down...'); await mongoose.disconnect(); process.exit(0); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const start = async () => {
  try {
    await mongoose.connect(MONGO_URL, { maxPoolSize: 20, minPoolSize: 5 });
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => { logger.info(`WAITRON started on port ${PORT}`); });
  } catch (error) { logger.error('Failed to start:', error); process.exit(1); }
};

start();

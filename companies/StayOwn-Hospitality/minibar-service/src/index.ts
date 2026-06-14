/**
 * Minibar Service
 * Port: 3810
 *
 * Smart Minibar - Track items, auto-bill, inventory management
 * "Guest takes item → auto-detected → auto-billed → inventory updated"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3810;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

// Redis & RabbitMQ
let redis: ReturnType<typeof createClient>;
let rabbit: amqp.Connection;

/**
 * Circuit breaker for external calls
 */
const circuitBreakers: Map<string, { failures: number; lastFailure: number; state: 'closed' | 'open' }> = new Map();

async function withCircuitBreaker(serviceName: string, fn: () => Promise<any>): Promise<any> {
  const cb = circuitBreakers.get(serviceName) || { failures: 0, lastFailure: 0, state: 'closed' };
  if (cb.state === 'open' && Date.now() - cb.lastFailure < 30000) {
    throw new Error(`Circuit breaker open for ${serviceName}`);
  }
  try {
    const result = await fn();
    cb.failures = 0;
    circuitBreakers.set(serviceName, cb);
    return result;
  } catch (error) {
    cb.failures++;
    cb.lastFailure = Date.now();
    if (cb.failures >= 3) cb.state = 'open';
    circuitBreakers.set(serviceName, cb);
    throw error;
  }
}

// ============ MODELS (In-Memory for Demo) ============

interface MinibarItem {
  id: string;
  name: string;
  category: 'beverage' | 'snack' | 'alcohol' | 'toiletries' | 'other';
  price: number;
  currency: string;
  stock: number;
  reorderLevel: number;
}

interface GuestMinibarUsage {
  guestId: string;
  hotelId: string;
  roomId: string;
  items: { itemId: string; quantity: number; timestamp: Date; total: number }[];
  totalCharges: number;
  checkedInAt: Date;
}

// Demo inventory
const inventory: Map<string, MinibarItem[]> = new Map();
const guestUsage: Map<string, GuestMinibarUsage[]> = new Map();

// Initialize demo inventory
function initDemoInventory(hotelId: string) {
  if (!inventory.has(hotelId)) {
    inventory.set(hotelId, [
      { id: 'water-1', name: 'Mineral Water', category: 'beverage', price: 20, currency: 'INR', stock: 6, reorderLevel: 2 },
      { id: 'cola-1', name: 'Soft Drink', category: 'beverage', price: 35, currency: 'INR', stock: 6, reorderLevel: 2 },
      { id: 'chips-1', name: 'Chips', category: 'snack', price: 50, currency: 'INR', stock: 4, reorderLevel: 2 },
      { id: 'beer-1', name: 'Local Beer', category: 'alcohol', price: 120, currency: 'INR', stock: 4, reorderLevel: 2 },
      { id: 'whisky-1', name: 'Whisky (50ml)', category: 'alcohol', price: 350, currency: 'INR', stock: 2, reorderLevel: 1 },
      { id: 'shampoo-1', name: 'Shampoo', category: 'toiletries', price: 80, currency: 'INR', stock: 3, reorderLevel: 1 },
      { id: 'toothpaste-1', name: 'Toothpaste', category: 'toiletries', price: 60, currency: 'INR', stock: 3, reorderLevel: 1 },
    ]);
  }
}

// ============ CHECKOUT INTEGRATION ============

/**
 * Get all charges for a guest (for checkout)
 */
async function getGuestCharges(guestId: string): Promise<{ charges: any[]; total: number }> {
  const usages = guestUsage.get(guestId) || [];
  const allCharges: any[] = [];

  for (const usage of usages) {
    for (const item of usage.items) {
      allCharges.push({
        type: 'minibar',
        description: `Minibar - ${item.itemId}`,
        amount: item.total,
        currency: 'INR',
        timestamp: item.timestamp
      });
    }
  }

  return { charges: allCharges, total: allCharges.reduce((sum, c) => sum + c.amount, 0) };
}

// ============ REST API ============

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'minibar-service', port: PORT });
});

// Get hotel minibar inventory
app.get('/hotels/:hotelId/inventory', (req, res) => {
  initDemoInventory(req.params.hotelId);
  res.json({ items: inventory.get(req.params.hotelId) || [] });
});

// Get minibar menu for guest (with pricing)
app.get('/guests/:guestId/menu', (req, res) => {
  const hotelId = req.query.hotelId as string || 'default';
  initDemoInventory(hotelId);
  const items = inventory.get(hotelId) || [];
  res.json({
    items: items.filter(i => i.stock > 0),
    currency: 'INR'
  });
});

// Record item consumption
app.post('/guests/:guestId/consume', async (req: Request, res: Response) => {
  const { hotelId, roomId, itemId, quantity = 1 } = req.body;
  const guestId = req.params.guestId;

  if (!hotelId || !itemId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  initDemoInventory(hotelId);
  const items = inventory.get(hotelId) || [];
  const item = items.find(i => i.id === itemId);

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (item.stock < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  // Update inventory
  item.stock -= quantity;

  // Record usage
  const total = item.price * quantity;
  const usage: GuestMinibarUsage = {
    guestId,
    hotelId,
    roomId: roomId || 'unknown',
    items: [{ itemId, quantity, timestamp: new Date(), total }],
    totalCharges: total,
    checkedInAt: new Date()
  };

  if (!guestUsage.has(guestId)) {
    guestUsage.set(guestId, []);
  }
  guestUsage.get(guestId)!.push(usage);

  // Check reorder level
  if (item.stock <= item.reorderLevel) {
    // Notify housekeeping
    await notifyReorder(item, hotelId);
  }

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('minibar.item.consumed', Buffer.from(JSON.stringify({
      guestId, hotelId, roomId, itemId, quantity, total
    })));
  } catch (e) { /* Rabbit not required */ }

  logger.info('Minibar item consumed', { guestId, itemId, quantity, total });

  res.json({ success: true, item: { name: item.name, quantity, total } });
});

// Get guest charges (for checkout)
app.get('/guests/:guestId/charges', async (req: Request, res: Response) => {
  const charges = await getGuestCharges(req.params.guestId);
  res.json(charges);
});

// Set guest preferences
app.post('/guests/:guestId/preferences', async (req: Request, res: Response) => {
  const { preferences } = req.body;
  const guestId = req.params.guestId;

  // Store preferences in Redis
  try {
    await redis.set(`minibar:prefs:${guestId}`, JSON.stringify(preferences), { EX: 86400 * 30 });
  } catch (e) { /* Redis optional */ }

  res.json({ success: true });
});

// Get guest preferences
app.get('/guests/:guestId/preferences', async (req: Request, res: Response) => {
  const guestId = req.params.guestId;

  try {
    const prefs = await redis.get(`minibar:prefs:${guestId}`);
    if (prefs) {
      return res.json({ preferences: JSON.parse(prefs) });
    }
  } catch (e) { /* Redis optional */ }

  res.json({ preferences: null });
});

// Restock minibar
app.post('/hotels/:hotelId/rooms/:roomId/restock', (req, res) => {
  const { items } = req.body;
  const hotelId = req.params.hotelId;

  initDemoInventory(hotelId);
  const inventoryItems = inventory.get(hotelId) || [];

  for (const restock of items) {
    const item = inventoryItems.find(i => i.id === restock.itemId);
    if (item) {
      item.stock = restock.quantity || item.stock + 5;
    }
  }

  res.json({ success: true });
});

// Circuit breakers
app.get('/circuit-breakers', (req, res) => {
  const status: Record<string, any> = {};
  circuitBreakers.forEach((cb, name) => { status[name] = cb; });
  res.json(status);
});

async function notifyReorder(item: MinibarItem, hotelId: string) {
  // In production, this would notify housekeeping or procurement
  logger.warn('Low stock alert', { item: item.name, stock: item.stock, hotelId });
}

async function init() {
  // Redis (optional)
  try {
    redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redis.on('error', () => {});
    await redis.connect();
  } catch (e) {
    logger.warn('Redis not available, using in-memory storage');
  }

  // RabbitMQ (optional)
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    rabbit = await amqp.connect(rabbitUrl);
  } catch (e) {
    logger.warn('RabbitMQ not available');
  }

  // Initialize demo inventory
  initDemoInventory('default');

  logger.info('Minibar Service initialized');
}

init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Minibar Service running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };

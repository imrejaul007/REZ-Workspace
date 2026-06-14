/**
 * Lost and Found Service
 * Port: 3816
 *
 * Item tracking, claims, notifications
 * "Item found → logged → guest notified → claimed"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4816', 10);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: ReturnType<typeof createClient>;
let rabbit: amqp.Connection;

// ============ MODELS ============

interface LostFoundItem {
  id: string;
  hotelId: string;
  category: 'electronics' | 'clothing' | 'jewelry' | 'documents' | 'bags' | 'toiletries' | 'other';
  description: string;
  brand?: string;
  color?: string;
  foundLocation: string;
  foundBy: string; // staff ID
  foundAt: Date;
  status: 'found' | 'claimed' | 'returned' | 'disposed';
  images?: string[];
  guestId?: string; // if claimed
  claimedAt?: Date;
  returnedAt?: Date;
  notes?: string;
}

interface Claim {
  id: string;
  itemId: string;
  guestId: string;
  description: string;
  proof?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

const items: Map<string, LostFoundItem> = new Map();
const claims: Map<string, Claim> = new Map();

// ============ REST API ============

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'lost-found', port: PORT });
});

// Report found item
app.post('/items', async (req: Request, res: Response) => {
  const { hotelId, category, description, brand, color, foundLocation, foundBy, images, notes } = req.body;

  const item: LostFoundItem = {
    id: uuidv4(),
    hotelId,
    category,
    description,
    brand,
    color,
    foundLocation,
    foundBy,
    foundAt: new Date(),
    status: 'found',
    images,
    notes
  };

  items.set(item.id, item);

  // Try to match with guest
  await tryMatchWithGuest(item);

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('lostfound.item.found', Buffer.from(JSON.stringify(item)));
  } catch (e) { /* Rabbit optional */ }

  logger.info('Lost item found', { itemId: item.id, hotelId, category });

  res.json({ item });
});

// Get all items
app.get('/hotels/:hotelId/items', (req, res) => {
  const { status, category } = req.query;
  let hotelItems = Array.from(items.values()).filter(i => i.hotelId === req.params.hotelId);

  if (status) hotelItems = hotelItems.filter(i => i.status === status);
  if (category) hotelItems = hotelItems.filter(i => i.category === category);

  res.json({ items: hotelItems });
});

// Get item
app.get('/items/:id', (req, res) => {
  const item = items.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json({ item });
});

// Submit claim
app.post('/claims', async (req: Request, res: Response) => {
  const { itemId, guestId, description, proof } = req.body;

  const item = items.get(itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (item.status !== 'found') {
    return res.status(400).json({ error: 'Item is not available for claim' });
  }

  const claim: Claim = {
    id: uuidv4(),
    itemId,
    guestId,
    description,
    proof,
    status: 'pending',
    createdAt: new Date()
  };

  claims.set(claim.id, claim);

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('lostfound.claim.submitted', Buffer.from(JSON.stringify(claim)));
  } catch (e) { /* Rabbit optional */ }

  logger.info('Claim submitted', { claimId: claim.id, itemId, guestId });

  res.json({ claim });
});

// Get guest claims
app.get('/guests/:guestId/claims', (req, res) => {
  const guestClaims = Array.from(claims.values()).filter(c => c.guestId === req.params.guestId);
  res.json({ claims: guestClaims.map(c => ({
    ...c,
    item: items.get(c.itemId)
  }))});
});

// Review claim (staff)
app.post('/claims/:id/review', (req: Request, res) => {
  const { status, reviewedBy, notes } = req.body;

  const claim = claims.get(req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  claim.status = status;
  claim.reviewedBy = reviewedBy;
  claim.reviewedAt = new Date();

  if (status === 'approved') {
    const item = items.get(claim.itemId);
    if (item) {
      item.status = 'claimed';
      item.guestId = claim.guestId;
      item.claimedAt = new Date();
      if (notes) item.notes = notes;
    }
  }

  // Notify guest
  try {
    notifyGuest(claim.guestId, status === 'approved' ? 'claim_approved' : 'claim_rejected', { itemId: claim.itemId });
  } catch (e) { /* Notification optional */ }

  res.json({ claim });
});

// Return item
app.post('/items/:id/return', (req, res) => {
  const item = items.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  item.status = 'returned';
  item.returnedAt = new Date();

  // Notify guest
  try {
    notifyGuest(item.guestId!, 'item_returned', { itemId: item.id });
  } catch (e) { /* Notification optional */ }

  res.json({ item });
});

// Dispose item (after retention period)
app.post('/items/:id/dispose', (req, res) => {
  const item = items.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  item.status = 'disposed';

  res.json({ item });
});

// ============ HELPERS ============

async function tryMatchWithGuest(item: LostFoundItem) {
  // In production, this would:
  // 1. Search recent checkout guests
  // 2. Check for matching items in guest profile
  // 3. Send notification if match found
  logger.info('Attempting to match item with guest', { itemId: item.id });
}

async function notifyGuest(guestId: string, type: string, data: any) {
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('notification.guest', Buffer.from(JSON.stringify({
      guestId,
      type,
      data
    })));
  } catch (e) {
    logger.warn('Failed to send notification', { guestId, type });
  }
}

async function init() {
  try {
    redis = createClient({ url: process.env.REDIS_URL || 4816'redis://localhost:6379' });
    redis.on('error', () => {});
    await redis.connect();
  } catch (e) {
    logger.warn('Redis not available');
  }

  try {
    rabbit = await amqp.connect(process.env.RABBITMQ_URL || 4816'amqp://localhost:5672');
  } catch (e) {
    logger.warn('RabbitMQ not available');
  }

  logger.info('Lost and Found Service initialized');
}

init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Lost and Found Service running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };

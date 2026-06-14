/**
 * REZ Scan - QR/Barcode Scanner Service
 * Port: 3017
 *
 * Features:
 * - QR code scanning (URL, Payment, Contact, WiFi, Text)
 * - Barcode product lookup
 * - MongoDB persistence
 * - RABTUL wallet integration for rewards
 * - WebSocket for real-time updates
 * - OpenAPI documentation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3017', 10);

// Create HTTP server for WebSocket
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-scan';
let isConnected = false;

async function connectDatabase() {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('[MongoDB] Connected to', MONGODB_URI);
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    console.log('[WARNING] Running in in-memory mode');
  }
}

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Logger
const logger = {
  info: (msg: string) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
};
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET
// ═══════════════════════════════════════════════════════════════════════════════

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe', (userId: string) => {
    socket.join(`user:${userId}`);
    logger.info(`Client ${socket.id} subscribed to user:${userId}`);
  });

  socket.on('unsubscribe', (userId: string) => {
    socket.leave(`user:${userId}`);
    logger.info(`Client ${socket.id} unsubscribed from user:${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Broadcast function for real-time updates
function broadcastScan(userId: string, scan: any) {
  io.to(`user:${userId}`).emit('scan', scan);
  io.to('admin').emit('scan', scan);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONGOOSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const ScanSchema = new mongoose.Schema({
  scanId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['qr', 'barcode', 'text'], default: 'qr' },
  value: { type: String, required: true },
  image: { type: String },
  result: { type: mongoose.Schema.Types.Mixed },
  deviceId: { type: String },
  location: { lat: Number, lng: Number },
  createdAt: { type: Date, default: Date.now }
});

ScanSchema.index({ userId: 1, createdAt: -1 });
ScanSchema.index({ type: 1, createdAt: -1 });

const ProductSchema = new mongoose.Schema({
  barcode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: String,
  category: String,
  price: Number,
  image: String,
  createdAt: { type: Date, default: Date.now }
});

ProductSchema.index({ barcode: 1 });

const Scan = mongoose.models.Scan || mongoose.model('Scan', ScanSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// In-memory fallback
const scans = new Map();
const products = new Map();
const sampleProducts = [
  { barcode: '8901030867898', name: 'Amul Butter', brand: 'Amul', category: 'dairy', price: 250 },
  { barcode: '8904187000000', name: 'Parle-G Biscuit', brand: 'Parle', category: 'food', price: 30 },
];
sampleProducts.forEach(p => products.set(p.barcode, p));

// ═══════════════════════════════════════════════════════════════════════════════
// RABTUL INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

const RABTUL = {
  WALLET_URL: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || ''
};

async function creditCoins(userId: string, amount: number, source: string): Promise<boolean> {
  try {
    await axios.post(`${RABTUL.WALLET_URL}/api/wallet/credit`, {
      user_id: userId,
      amount,
      source,
      reference_id: `scan-${Date.now()}`
    }, { headers: { 'X-Internal-Token': RABTUL.INTERNAL_TOKEN } });
    return true;
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-scan',
    version: '1.0.2',
    port: PORT,
    database: isConnected ? 'MongoDB' : 'in-memory',
    websocket: 'connected',
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// OPENAPI SPEC
// ═══════════════════════════════════════════════════════════════════════════════

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'REZ Scan API',
    description: 'Universal QR/Barcode scanner with MongoDB persistence, WebSocket, and RABTUL rewards',
    version: '1.0.2',
    contact: { name: 'REZ Team', email: 'dev@rez.money' }
  },
  servers: [{ url: `http://localhost:${PORT}`, description: 'Local' }],
  websocket: {
    endpoint: `ws://localhost:${PORT}`,
    events: ['scan', 'product_update', 'coin_credited']
  },
  paths: {
    '/health': { get: { summary: 'Health check', responses: { '200': { description: 'OK' } } } },
    '/api/scan': { post: { summary: 'Scan QR/barcode', responses: { '200': { description: 'Scan recorded' } } } },
    '/api/scans': { get: { summary: 'Get scan history', responses: { '200': { description: 'List of scans' } } } },
    '/api/products/{barcode}': { get: { summary: 'Get product', responses: { '200': { description: 'Product' }, '404': { description: 'Not found' } } } },
    '/api/products': { post: { summary: 'Add product', responses: { '200': { description: 'Created' } } } },
    '/api/qr-types': { get: { summary: 'List QR types', responses: { '200': { description: 'Types' } } } },
    '/api/analytics': { get: { summary: 'Get analytics', responses: { '200': { description: 'Analytics' } } } }
  }
};

app.get('/api-docs', (req, res) => res.json(openApiSpec));

// ═══════════════════════════════════════════════════════════════════════════════
// SCAN API
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/scan', async (req, res) => {
  const { userId, type, value, image, deviceId, location } = req.body;
  if (!userId || !value) return res.status(400).json({ success: false, error: 'userId, value required' });

  const scanId = uuidv4();
  let result = { type: 'text', data: { text: value } };

  if (type === 'barcode' || value.match(/^\d{8,14}$/)) {
    const barcode = isConnected ? await Product.findOne({ barcode: value }) : products.get(value);
    result = barcode ? { type: 'product', data: barcode } : { type: 'unknown', message: 'Product not found' };
  } else if (value.startsWith('http')) result = { type: 'url', data: { url: value } };
  else if (value.startsWith('upi://')) result = { type: 'payment', data: { upi: value } };
  else if (value.startsWith('BEGIN:VCARD')) result = { type: 'contact', data: { raw: value } };
  else if (value.startsWith('WIFI:')) result = { type: 'wifi', data: { raw: value } };

  const scan = { scanId, userId, type: type || 'qr', value, image, result, deviceId, location, createdAt: new Date() };

  if (isConnected) await Scan.create(scan);
  else scans.set(scanId, scan);

  // Credit coins and broadcast
  let coinsCredited = 0;
  if (userId && result.type !== 'unknown') {
    const credited = await creditCoins(userId, 1, 'qr_scan');
    if (credited) {
      coinsCredited = 1;
      broadcastScan(userId, { ...scan, coinsCredited, event: 'coin_credited' });
    }
  }

  // Broadcast to all subscribers
  broadcastScan(userId, { ...scan, coinsCredited });

  res.json({ success: true, scan, coinsCredited });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORY API
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/scans', async (req, res) => {
  const { userId, type, limit = 50 } = req.query;
  let list;

  if (isConnected) {
    const query: any = {};
    if (userId) query.userId = userId;
    if (type) query.type = type;
    list = await Scan.find(query).sort({ createdAt: -1 }).limit(Number(limit));
  } else {
    list = Array.from(scans.values());
    if (userId) list = list.filter(s => s.userId === userId);
    if (type) list = list.filter(s => s.type === type);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    list = list.slice(0, Number(limit));
  }

  res.json({ success: true, scans: list, count: list.length });
});

app.get('/api/scans/:id', async (req, res) => {
  const scan = isConnected ? await Scan.findOne({ scanId: req.params.id }) : scans.get(req.params.id);
  if (!scan) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, scan });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT API
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/products/:barcode', async (req, res) => {
  const product = isConnected ? await Product.findOne({ barcode: req.params.barcode }) : products.get(req.params.barcode);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, product });
});

app.post('/api/products', async (req, res) => {
  const { barcode, name, brand, category, price, image } = req.body;
  if (!barcode || !name) return res.status(400).json({ success: false, error: 'barcode, name required' });
  const product = { barcode, name, brand, category, price, image, createdAt: new Date() };
  if (isConnected) await Product.findOneAndUpdate({ barcode }, product, { upsert: true });
  products.set(barcode, product);

  // Broadcast product update
  io.emit('product_update', product);

  res.json({ success: true, product });
});

// ═══════════════════════════════════════════════════════════════════════════════
// QR TYPES & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/qr-types', (req, res) => {
  res.json({ success: true, types: [
    { id: 'url', name: 'URL/Link', icon: '🔗' },
    { id: 'payment', name: 'UPI Payment', icon: '💰' },
    { id: 'contact', name: 'Contact Card', icon: '📇' },
    { id: 'wifi', name: 'WiFi', icon: '📶' },
    { id: 'text', name: 'Text', icon: '📝' },
    { id: 'product', name: 'Product', icon: '📦' }
  ]});
});

app.get('/api/analytics', async (req, res) => {
  const { userId, from, to } = req.query;
  let totalScans = 0, byType: Record<string, number> = {};

  if (isConnected) {
    const query: any = {};
    if (userId) query.userId = userId;
    if (from || to) { query.createdAt = {}; if (from) query.createdAt.$gte = new Date(from as string); if (to) query.createdAt.$lte = new Date(to as string); }
    totalScans = await Scan.countDocuments(query);
    const typeAgg = await Scan.aggregate([{ $match: query }, { $group: { _id: '$type', count: { $sum: 1 } } }]);
    byType = typeAgg.reduce((acc: Record<string, number>, item) => { acc[item._id] = item.count; return acc; }, {});
  } else {
    totalScans = scans.size;
    scans.forEach(s => { byType[s.type] = (byType[s.type] || 0) + 1; });
  }

  res.json({ success: true, analytics: { totalScans, byType, database: isConnected ? 'MongoDB' : 'in-memory' } });
});

// ═══════════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════════

async function start() {
  await connectDatabase();

  server.listen(PORT, () => {
    console.log(`\n╔═══════════════════════════════════════════════════════════════╗
║           REZ Scan Service v1.0.2                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Port:    ${PORT}                                              ║
║  WebSocket: ws://localhost:${PORT}                           ║
║  Database: ${isConnected ? 'MongoDB ✅' : 'In-Memory ⚠️'}                            ║
║  Docs:     http://localhost:${PORT}/api-docs                   ║
╚═══════════════════════════════════════════════════════════════╝\n`);
  });
}

start();
export default app;
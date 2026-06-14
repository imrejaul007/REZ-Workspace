/**
 * REZ Menu QR - Restaurant Menu QR Service
 * Table management, menu display, order placement
 * NOW WITH MONGODB PERSISTENCE
 */

import express from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
});
app.use('/api/', limiter);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-menu-qr';

let isConnected = false;

async function connectDatabase() {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('[MongoDB] Connected to', MONGODB_URI);
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    // Fall back to in-memory if MongoDB unavailable
    console.log('[WARNING] Running in in-memory mode');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONGOOSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

// Menu Schema
const MenuItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  description: String,
  available: { type: Boolean, default: true },
});

const CategorySchema = new mongoose.Schema({
  id: String,
  name: String,
  items: [MenuItemSchema],
});

const MenuSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true, unique: true, index: true },
  name: String,
  categories: [CategorySchema],
  updatedAt: { type: Date, default: Date.now },
});

// Table Schema
const TableSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true, index: true },
  tableId: { type: String, required: true },
  number: Number,
  name: String,
  capacity: Number,
  status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' },
  updatedAt: { type: Date, default: Date.now },
});

// Compound unique index
TableSchema.index({ restaurantId: 1, tableId: 1 }, { unique: true });

// Order Schema
const OrderItemSchema = new mongoose.Schema({
  itemId: String,
  name: String,
  price: Number,
  quantity: Number,
});

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  tableId: String,
  items: [OrderItemSchema],
  customerName: String,
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'], default: 'pending' },
  total: Number,
  createdAt: { type: Date, default: Date.now },
});

// Models
const Menu = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
const Table = mongoose.models.Table || mongoose.model('Table', TableSchema);
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

// QR Types
const QR_TYPES = {
  TABLE: 'table',
  MENU: 'menu',
  ORDER: 'order',
  PAYMENT: 'payment',
};

// Demo data initializer
async function initDemoData(restaurantId: string) {
  // Initialize menu
  const existingMenu = await Menu.findOne({ restaurantId });
  if (!existingMenu && isConnected) {
    await Menu.create({
      restaurantId,
      name: 'Demo Restaurant',
      categories: [
        { id: 'cat-1', name: 'Starters', items: [
          { id: 'i1', name: 'Spring Rolls', price: 150, description: 'Crispy vegetable rolls' },
          { id: 'i2', name: 'Soup', price: 120, description: 'Hot and sour soup' },
        ]},
        { id: 'cat-2', name: 'Main Course', items: [
          { id: 'i3', name: 'Biryani', price: 250, description: 'Hyderabadi biryani' },
          { id: 'i4', name: 'Curry', price: 200, description: 'Butter chicken curry' },
        ]},
      ],
    });
  }

  // Initialize tables
  if (isConnected) {
    const tableCount = await Table.countDocuments({ restaurantId });
    if (tableCount === 0) {
      await Table.insertMany([
        { restaurantId, tableId: 't1', number: 1, capacity: 4, status: 'available' },
        { restaurantId, tableId: 't2', number: 2, capacity: 6, status: 'available' },
        { restaurantId, tableId: 't3', number: 3, capacity: 2, status: 'available' },
      ]);
    }
  }
}

// In-memory fallback stores
const tables = new Map();
const menus = new Map();
const orders = new Map();

// Helper to get data from MongoDB or fallback to memory
async function getMenu(restaurantId: string) {
  if (isConnected) {
    return await Menu.findOne({ restaurantId });
  }
  return menus.get(restaurantId);
}

async function getTables(restaurantId: string) {
  if (isConnected) {
    return await Table.find({ restaurantId });
  }
  return tables.get(restaurantId) || [];
}

async function saveOrder(order: any) {
  if (isConnected) {
    await order.save();
  }
  orders.set(order.orderId, order);
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'REZ Menu QR',
    version: '2.0.0',
    database: isConnected ? 'MongoDB' : 'in-memory',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/menu/generate-qr
app.post('/api/menu/generate-qr', async (req, res) => {
  const { restaurantId, tableId, type = 'menu' } = req.body;

  if (!restaurantId) {
    return res.status(400).json({ success: false, error: 'restaurantId required' });
  }

  await initDemoData(restaurantId);

  const qrContent = `REZ:${type}:${restaurantId}:${tableId || ''}`;
  const qrUrl = `https://rez.money/menu/${restaurantId}${tableId ? `?table=${tableId}` : ''}`;

  res.json({
    success: true,
    data: {
      qr_content: qrContent,
      qr_url: qrUrl,
      type,
      restaurant_id: restaurantId,
      table_id: tableId || null,
    },
  });
});

// GET /api/menu/:restaurantId
app.get('/api/menu/:restaurantId', async (req, res) => {
  const { restaurantId } = req.params;
  await initDemoData(restaurantId);

  const menu = await getMenu(restaurantId);

  if (!menu) {
    return res.status(404).json({ success: false, error: 'Menu not found' });
  }

  res.json({ success: true, data: menu });
});

// GET /api/menu/:restaurantId/tables
app.get('/api/menu/:restaurantId/tables', async (req, res) => {
  const { restaurantId } = req.params;
  await initDemoData(restaurantId);

  const restaurantTables = await getTables(restaurantId);

  res.json({
    success: true,
    data: {
      tables: restaurantTables,
      storage: isConnected ? 'MongoDB' : 'in-memory'
    },
  });
});

// POST /api/menu/table
app.post('/api/menu/table', async (req, res) => {
  const { restaurantId, tableId, number, name, capacity } = req.body;

  if (!restaurantId || !tableId) {
    return res.status(400).json({ success: false, error: 'restaurantId and tableId required' });
  }

  if (isConnected) {
    const table = await Table.findOneAndUpdate(
      { restaurantId, tableId },
      { restaurantId, tableId, number, name, capacity, status: 'available' },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: table });
  }

  // In-memory fallback
  const table = { restaurantId, tableId, number, name, capacity, status: 'available' };
  const existing = tables.get(restaurantId) || [];
  const idx = existing.findIndex((t: any) => t.tableId === tableId);
  if (idx >= 0) {
    existing[idx] = table;
  } else {
    existing.push(table);
  }
  tables.set(restaurantId, existing);
  res.json({ success: true, data: table, storage: 'in-memory' });
});

// PATCH /api/menu/table/:restaurantId/:tableId/status
app.patch('/api/menu/table/:restaurantId/:tableId/status', async (req, res) => {
  const { restaurantId, tableId } = req.params;
  const { status } = req.body;

  if (isConnected) {
    const table = await Table.findOneAndUpdate(
      { restaurantId, tableId },
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!table) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }
    return res.json({ success: true, data: table });
  }

  res.json({ success: false, error: 'MongoDB not connected' });
});

// POST /api/menu/order
app.post('/api/menu/order', async (req, res) => {
  const { restaurantId, tableId, items, customerName } = req.body;

  if (!restaurantId || !items || items.length === 0) {
    return res.status(400).json({ success: false, error: 'restaurantId and items required' });
  }

  const orderId = uuidv4();
  const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  if (isConnected) {
    const order = new Order({
      orderId,
      restaurantId,
      tableId,
      items,
      customerName,
      status: 'pending',
      total,
    });
    await order.save();
    return res.json({ success: true, data: { order }, storage: 'MongoDB' });
  }

  // In-memory fallback
  const order = {
    orderId,
    restaurantId,
    tableId,
    items,
    customerName,
    status: 'pending',
    total,
    createdAt: new Date(),
  };
  orders.set(orderId, order);
  res.json({ success: true, data: { order }, storage: 'in-memory' });
});

// GET /api/menu/order/:orderId
app.get('/api/menu/order/:orderId', async (req, res) => {
  const { orderId } = req.params;

  if (isConnected) {
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    return res.json({ success: true, data: order });
  }

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

// PATCH /api/menu/order/:orderId/status
app.patch('/api/menu/order/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (isConnected) {
    const order = await Order.findOneAndUpdate(
      { orderId },
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    return res.json({ success: true, data: order });
  }

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  order.status = status;
  orders.set(orderId, order);
  res.json({ success: true, data: order });
});

// GET /api/menu/:restaurantId/orders
app.get('/api/menu/:restaurantId/orders', async (req, res) => {
  const { restaurantId } = req.params;
  const { status } = req.query;

  if (isConnected) {
    const query: any = { restaurantId };
    if (status) {
      query.status = status;
    }
    const orders = await Order.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, data: orders });
  }

  const allOrders = Array.from(orders.values()).filter(
    (o: any) => o.restaurantId === restaurantId && (!status || o.status === status)
  );
  res.json({ success: true, data: allOrders });
});

// ═══════════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3014;

async function start() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           REZ Menu QR Service v2.0.0                      ║
╠═══════════════════════════════════════════════════════════════╣
║  Port:    ${PORT}                                              ║
║  Database: ${isConnected ? 'MongoDB ✅' : 'In-Memory ⚠️'}                              ║
║  Purpose: Restaurant menu QR + table management             ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  });
}

start();

export default app;

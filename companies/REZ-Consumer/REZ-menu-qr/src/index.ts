/**
 * REZ Menu QR - Restaurant Digital Menu
 * QR code menus for restaurants, cafes, hotels
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

import { v4 as uuidv4 } from 'uuid';

const logger = {
  info: (msg: string) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
};

const app = express();
const PORT = parseInt(process.env.PORT || '3017', 10);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================
// STORES
// ============================================

const restaurants = new Map();
const menus = new Map();
const categories = new Map();
const items = new Map();
const orders = new Map();

// ============================================
// HEALTH
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-menu-qr',
    version: '1.0.0',
    stats: { restaurants: restaurants.size, menus: menus.size, items: items.size }
  });
});

// ============================================
// RESTAURANTS
// ============================================

app.post('/api/restaurants', (req, res) => {
  const { name, address, phone, cuisine, hours, logo } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'name required' });
  }

  const restaurant = {
    id: uuidv4(),
    name,
    address: address || '',
    phone: phone || '',
    cuisine: cuisine || '',
    hours: hours || {},
    logo: logo || '',
    menuId: null,
    status: 'active',
    createdAt: new Date()
  };

  restaurants.set(restaurant.id, restaurant);
  logger.info(`Restaurant: ${restaurant.id}`);

  res.json({ success: true, restaurant });
});

app.get('/api/restaurants', (req, res) => {
  const { cuisine, search } = req.query;
  let list = Array.from(restaurants.values());

  if (cuisine) list = list.filter(r => r.cuisine === cuisine);
  if (search) {
    const s = (search as string).toLowerCase();
    list = list.filter(r => r.name.toLowerCase().includes(s));
  }

  res.json({ success: true, restaurants: list });
});

app.get('/api/restaurants/:id', (req, res) => {
  const restaurant = restaurants.get(req.params.id);
  if (!restaurant) return res.status(404).json({ success: false, error: 'Not found' });

  // Get menu
  const menu = restaurant.menuId ? menus.get(restaurant.menuId) : null;

  res.json({ success: true, restaurant: { ...restaurant, menu } });
});

// ============================================
// MENUS
// ============================================

app.post('/api/menus', (req, res) => {
  const { restaurantId, name, description } = req.body;

  if (!restaurantId || !name) {
    return res.status(400).json({ success: false, error: 'restaurantId, name required' });
  }

  const restaurant = restaurants.get(restaurantId);
  if (!restaurant) return res.status(404).json({ success: false, error: 'Restaurant not found' });

  const menu = {
    id: uuidv4(),
    restaurantId,
    name,
    description: description || '',
    categories: [],
    createdAt: new Date()
  };

  menus.set(menu.id, menu);
  restaurant.menuId = menu.id;
  restaurants.set(restaurantId, restaurant);

  res.json({ success: true, menu });
});

app.get('/api/menus/:id', (req, res) => {
  const menu = menus.get(req.params.id);
  if (!menu) return res.status(404).json({ success: false, error: 'Not found' });

  // Get categories and items
  const menuCategories = Array.from(categories.values()).filter(c => c.menuId === menu.id);
  const menuItems = Array.from(items.values()).filter(i => i.menuId === menu.id);

  res.json({ success: true, menu: { ...menu, categories: menuCategories, items: menuItems } });
});

// ============================================
// CATEGORIES
// ============================================

app.post('/api/categories', (req, res) => {
  const { menuId, name, description, sortOrder } = req.body;

  if (!menuId || !name) {
    return res.status(400).json({ success: false, error: 'menuId, name required' });
  }

  const category = {
    id: uuidv4(),
    menuId,
    name,
    description: description || '',
    sortOrder: sortOrder || 0,
    createdAt: new Date()
  };

  categories.set(category.id, category);
  res.json({ success: true, category });
});

// ============================================
// ITEMS
// ============================================

app.post('/api/items', (req, res) => {
  const { menuId, categoryId, name, description, price, image, options, available } = req.body;

  if (!menuId || !name || price === undefined) {
    return res.status(400).json({ success: false, error: 'menuId, name, price required' });
  }

  const item = {
    id: uuidv4(),
    menuId,
    categoryId: categoryId || null,
    name,
    description: description || '',
    price: parseFloat(price),
    image: image || '',
    options: options || [],
    available: available !== false,
    createdAt: new Date()
  };

  items.set(item.id, item);
  res.json({ success: true, item });
});

app.get('/api/items', (req, res) => {
  const { menuId, categoryId, available } = req.query;
  let list = Array.from(items.values());

  if (menuId) list = list.filter(i => i.menuId === menuId);
  if (categoryId) list = list.filter(i => i.categoryId === categoryId);
  if (available !== undefined) list = list.filter(i => i.available === (available === 'true'));

  res.json({ success: true, items: list });
});

app.put('/api/items/:id', (req, res) => {
  const item = items.get(req.params.id);
  if (!item) return res.status(404).json({ success: false, error: 'Not found' });

  const updated = { ...item, ...req.body, updatedAt: new Date() };
  items.set(req.params.id, updated);
  res.json({ success: true, item: updated });
});

// ============================================
// ORDERS
// ============================================

app.post('/api/orders', (req, res) => {
  const { restaurantId, tableNumber, items: orderItems, customerNote } = req.body;

  if (!restaurantId || !orderItems || orderItems.length === 0) {
    return res.status(400).json({ success: false, error: 'restaurantId, items required' });
  }

  const order = {
    id: uuidv4(),
    restaurantId,
    tableNumber: tableNumber || null,
    items: orderItems,
    customerNote: customerNote || '',
    status: 'pending',
    total: orderItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0),
    createdAt: new Date()
  };

  orders.set(order.id, order);
  logger.info(`Order: ${order.id}`);

  res.json({ success: true, order });
});

app.get('/api/orders', (req, res) => {
  const { restaurantId, status } = req.query;
  let list = Array.from(orders.values());

  if (restaurantId) list = list.filter(o => o.restaurantId === restaurantId);
  if (status) list = list.filter(o => o.status === status);

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, orders: list });
});

app.put('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Not found' });

  const updated = { ...order, ...req.body, updatedAt: new Date() };
  orders.set(req.params.id, updated);
  res.json({ success: true, order: updated });
});

// ============================================
// PUBLIC MENU (QR Code Access)
// ============================================

app.get('/api/menu/:restaurantId', (req, res) => {
  const restaurant = restaurants.get(req.params.restaurantId);
  if (!restaurant) return res.status(404).json({ success: false, error: 'Restaurant not found' });

  if (!restaurant.menuId) {
    return res.json({ success: true, restaurant, menu: null });
  }

  const menu = menus.get(restaurant.menuId);
  if (!menu) {
    return res.json({ success: true, restaurant, menu: null });
  }

  const menuCategories = Array.from(categories.values())
    .filter(c => c.menuId === menu.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const menuItems = Array.from(items.values())
    .filter(i => i.menuId === menu.id && i.available);

  const categoriesWithItems = menuCategories.map(cat => ({
    ...cat,
    items: menuItems.filter(i => i.categoryId === cat.id)
  }));

  res.json({
    success: true,
    restaurant,
    menu: { ...menu, categories: categoriesWithItems }
  });
});

app.listen(PORT, () => logger.info(`REZ Menu QR started on port ${PORT}`));

export default app;
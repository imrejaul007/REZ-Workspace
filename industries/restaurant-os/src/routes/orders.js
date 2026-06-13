/**
 * Order Routes
 */

import { Router } from 'express';

export const orderRoutes = Router();

const orders = new Map();
let orderCounter = 100;

// Initialize sample orders
orders.set('ORD-100', {
  id: 'ORD-100',
  items: [{ menuId: 'MENU-001', name: 'Butter Chicken', qty: 2, price: 320 }],
  total: 640,
  status: 'delivered',
  table: 'T3',
  customerName: 'Amit Kumar',
  createdAt: new Date(Date.now() - 60 * 60000).toISOString()
});

// Create order
orderRoutes.post('/', (req, res) => {
  const { items, table, customerName, notes } = req.body;

  orderCounter++;
  const id = `ORD-${orderCounter}`;
  const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const order = {
    id,
    items,
    total,
    status: 'pending',
    table,
    customerName,
    notes,
    createdAt: new Date().toISOString()
  };

  orders.set(id, order);
  res.status(201).json(order);
});

// Get all orders
orderRoutes.get('/', (req, res) => {
  const { status, date } = req.query;
  let result = Array.from(orders.values());

  if (status) result = result.filter(o => o.status === status);
  if (date) result = result.filter(o => o.createdAt.startsWith(date));

  res.json({ orders: result, total: result.length });
});

// Get single order
orderRoutes.get('/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Update order status
orderRoutes.patch('/:id/status', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = req.body.status;
  order.updatedAt = new Date().toISOString();
  res.json(order);
});

// Cancel order
orderRoutes.delete('/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = 'cancelled';
  res.json({ success: true, order });
});

// Get order by table
orderRoutes.get('/table/:tableNumber', (req, res) => {
  const tableOrders = Array.from(orders.values())
    .filter(o => o.table === req.params.tableNumber)
    .filter(o => ['pending', 'preparing', 'ready'].includes(o.status));

  res.json({ orders: tableOrders, total: tableOrders.length });
});

// Daily summary
orderRoutes.get('/summary/daily', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = Array.from(orders.values())
    .filter(o => o.createdAt.startsWith(today));

  const totalRevenue = todayOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  res.json({
    date: today,
    totalOrders: todayOrders.length,
    revenue: totalRevenue,
    avgOrderValue: todayOrders.length ? totalRevenue / todayOrders.filter(o => o.status === 'delivered').length : 0,
    byStatus: {
      pending: todayOrders.filter(o => o.status === 'pending').length,
      preparing: todayOrders.filter(o => o.status === 'preparing').length,
      ready: todayOrders.filter(o => o.status === 'ready').length,
      delivered: todayOrders.filter(o => o.status === 'delivered').length
    }
  });
});

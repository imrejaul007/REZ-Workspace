/**
 * Kitchen Routes - Kitchen Display System
 */

import { Router } from 'express';

export const kitchenRoutes = Router();

const kitchenOrders = new Map([
  ['ORD-101', {
    id: 'ORD-101',
    items: [{ menuId: 'MENU-001', name: 'Butter Chicken', qty: 2 }, { menuId: 'MENU-003', name: 'Garlic Naan', qty: 4 }],
    status: 'cooking',
    priority: 'normal',
    table: 'T5',
    startTime: new Date(Date.now() - 10 * 60000).toISOString(),
    estimatedCompletion: '5 min'
  }],
  ['ORD-102', {
    id: 'ORD-102',
    items: [{ menuId: 'MENU-002', name: 'Biryani', qty: 1 }, { menuId: 'MENU-004', name: 'Paneer Tikka', qty: 1 }],
    status: 'ready',
    priority: 'normal',
    table: 'T8',
    startTime: new Date(Date.now() - 15 * 60000).toISOString(),
    completedTime: new Date().toISOString()
  }]
]);

// Get all kitchen orders
kitchenRoutes.get('/orders', (req, res) => {
  const { status } = req.query;
  let orders = Array.from(kitchenOrders.values());

  if (status) {
    orders = orders.filter(o => o.status === status);
  }

  res.json({ orders, total: orders.length });
});

// Get active orders
kitchenRoutes.get('/orders/active', (req, res) => {
  const orders = Array.from(kitchenOrders.values())
    .filter(o => ['pending', 'cooking'].includes(o.status))
    .sort((a, b) => {
      if (a.priority === 'rush' && b.priority !== 'rush') return -1;
      if (b.priority === 'rush' && a.priority !== 'rush') return 1;
      return new Date(a.startTime) - new Date(b.startTime);
    });

  res.json({ orders, total: orders.length });
});

// Update order status
kitchenRoutes.patch('/orders/:id/status', (req, res) => {
  const order = kitchenOrders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const { status } = req.body;
  order.status = status;

  if (status === 'ready') {
    order.completedTime = new Date().toISOString();
  }

  res.json(order);
});

// Mark order ready
kitchenRoutes.post('/orders/:id/ready', (req, res) => {
  const order = kitchenOrders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = 'ready';
  order.completedTime = new Date().toISOString();

  res.json(order);
});

// Get station status
kitchenRoutes.get('/stations', (req, res) => {
  res.json({
    stations: [
      { id: 'GRILL', name: 'Grill Station', capacity: 4, inUse: 2, items: ['Butter Chicken', 'Paneer Tikka'] },
      { id: 'TANDOOR', name: 'Tandoor Station', capacity: 6, inUse: 3, items: ['Naan', 'Kulcha'] },
      { id: 'CURRY', name: 'Curry Station', capacity: 3, inUse: 1, items: ['Dal'] },
      { id: 'RICE', name: 'Rice Station', capacity: 2, inUse: 1, items: ['Biryani'] }
    ]
  });
});

// Get prep times
kitchenRoutes.get('/prep-times', (req, res) => {
  res.json({
    averagePrepTime: 12,
    byItem: [
      { item: 'Butter Chicken', avgTime: 15, targetTime: 12 },
      { item: 'Biryani', avgTime: 20, targetTime: 18 },
      { item: 'Garlic Naan', avgTime: 8, targetTime: 6 },
      { item: 'Paneer Tikka', avgTime: 12, targetTime: 10 }
    ]
  });
});

// Alert for delayed orders
kitchenRoutes.get('/alerts', (req, res) => {
  const delayed = Array.from(kitchenOrders.values())
    .filter(o => o.status === 'cooking')
    .filter(o => {
      const waitTime = (Date.now() - new Date(o.startTime).getTime()) / 60000;
      return waitTime > 15;
    });

  res.json({ delayed, count: delayed.length });
});

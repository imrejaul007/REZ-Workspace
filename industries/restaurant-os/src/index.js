/**
 * Restaurant OS - Full Industry Operating System
 * Part of RTMN Ecosystem
 *
 * Features:
 * - Digital Twins (Reservation, Menu, Kitchen, Staff, Customer)
 * - AI Agents (Order, Kitchen, Scheduling, Inventory)
 * - Business Copilot (6 interfaces)
 * - BOA Executive Intelligence
 */

import express from 'express';
import cors from 'cors';
import { reservationRoutes } from './routes/reservations.js';
import { menuRoutes } from './routes/menu.js';
import { kitchenRoutes } from './routes/kitchen.js';
import { orderRoutes } from './routes/orders.js';
import { staffRoutes } from './routes/staff.js';
import { customerRoutes } from './routes/customers.js';
import { inventoryRoutes } from './routes/inventory.js';
import { analyticsRoutes } from './routes/analytics.js';
import { digitalTwinsRoutes } from './routes/twins.js';
import { agentRoutes } from './routes/agents.js';

const app = express();
const PORT = process.env.PORT || 5010;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[Restaurant OS] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'restaurant-os',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      openTables: 12,
      pendingOrders: 8,
      activeStaff: 15,
      todayRevenue: 45200
    }
  });
});

// Dashboard
app.get('/api/dashboard', (req, res) => {
  res.json({
    overview: {
      todayRevenue: 45200,
      ordersToday: 127,
      avgOrderValue: 356,
      tableTurnover: 2.8,
      customerSatisfaction: 4.5
    },
    tables: {
      total: 25,
      occupied: 12,
      reserved: 8,
      available: 5
    },
    kitchen: {
      activeOrders: 8,
      avgPrepTime: '12 min',
      queue: 5
    },
    staff: {
      onDuty: 15,
      scheduled: 18,
      tipsToday: 8500
    },
    popularItems: [
      { name: 'Butter Chicken', orders: 45 },
      { name: 'Biryani', orders: 38 },
      { name: 'Naan', orders: 62 }
    ]
  });
});

// Routes
app.use('/api/reservations', reservationRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', digitalTwinsRoutes);
app.use('/api/agents', agentRoutes);

// Digital Twins endpoint
app.get('/api/twins/dashboard', (req, res) => {
  res.json({
    twins: {
      reservation: { total: 150, active: 45, health: 98 },
      menu: { total: 85, active: 80, health: 100 },
      kitchen: { total: 12, active: 8, health: 95 },
      order: { total: 127, active: 8, health: 97 },
      staff: { total: 45, active: 15, health: 99 },
      customer: { total: 2340, active: 120, health: 96 }
    },
    totalTwins: 2679,
    activeTwins: 256,
    avgHealth: 97.5
  });
});

// AI Copilot endpoints
app.post('/api/copilot/query', (req, res) => {
  const { query, context } = req.body;

  // Smart response based on query
  const queryLower = (query || '').toLowerCase();
  let response = 'Processing your query...';

  if (queryLower.includes('order') || queryLower.includes('sale')) {
    response = `**Order Analysis**\n\n📊 Today: 127 orders\n💰 Revenue: ₹45,200\n📈 Avg Order: ₹356\n\nTop Items:\n1. Butter Chicken - 45 orders\n2. Biryani - 38 orders\n\nRecommendations:\n• Stock up on chicken and rice\n• Consider combo offers for slow periods`;
  } else if (queryLower.includes('table') || queryLower.includes('reservation')) {
    response = `**Table Status**\n\n🪑 Total: 25 tables\n✅ Occupied: 12\n📅 Reserved: 8\n🔓 Available: 5\n\nNext Reservation: 7:30 PM (Party of 4)`;
  } else if (queryLower.includes('kitchen') || queryLower.includes('prep')) {
    response = `**Kitchen Status**\n\n🔥 Active Orders: 8\n⏱️ Avg Prep Time: 12 minutes\n📋 Queue: 5 orders\n\n⚠️ Attention:\n• Order #127 waiting 15 min\n• 3 orders delayed > 10 min`;
  } else if (queryLower.includes('staff') || queryLower.includes('schedule')) {
    response = `**Staff Dashboard**\n\n👨‍🍳 On Duty: 15\n📅 Scheduled: 18\n💰 Tips Today: ₹8,500\n\nRecommendations:\n• Add 2 servers for dinner rush\n• Consider overtime for kitchen`;  } else if (queryLower.includes('inventory') || queryLower.includes('stock')) {
    response = `**Inventory Alert**\n\n🚨 Low Stock:\n• Chicken: 15 kg (need 50 kg)\n• Basmati Rice: 20 kg (need 40 kg)\n• Cooking Oil: 5L (need 20 L)\n\n📞 Supplier: Fresh Foods Co.\n🚚 Next Delivery: Tomorrow 6 AM`;
  } else {
    response = `**Restaurant Dashboard**\n\n📊 Today's Performance:\n• Revenue: ₹45,200\n• Orders: 127\n• Covers: 380\n• Satisfaction: 4.5/5\n\nWhat would you like to analyze?`;
  }

  res.json({
    response,
    query,
    sources: ['restaurant-os', 'twins', 'inventory'],
    confidence: 0.92,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[Restaurant OS Error]', err);
  res.status(500).json({ error: 'Internal server error', service: 'restaurant-os' });
});

app.listen(PORT, () => {
  console.log(`🍽️ Restaurant OS running on port ${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`   Twins: http://localhost:${PORT}/api/twins/dashboard`);
  console.log(`   Copilot: http://localhost:${PORT}/api/copilot/query`);
});

export default app;

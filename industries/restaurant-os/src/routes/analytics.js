/**
 * Analytics Routes
 */

import { Router } from 'express';

export const analyticsRoutes = Router();

analyticsRoutes.get('/sales', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  res.json({
    date: today,
    totalOrders: 127,
    revenue: 45200,
    avgOrderValue: 356,
    byCategory: [
      { category: 'Main Course', orders: 45, revenue: 18000 },
      { category: 'Rice', orders: 38, revenue: 10640 },
      { category: 'Bread', orders: 62, revenue: 3720 },
      { category: 'Starter', orders: 25, revenue: 6250 }
    ]
  });
});

analyticsRoutes.get('/popular-items', (req, res) => {
  res.json({
    items: [
      { name: 'Butter Chicken', orders: 45, revenue: 14400 },
      { name: 'Biryani', orders: 38, revenue: 10640 },
      { name: 'Naan', orders: 62, revenue: 3720 },
      { name: 'Paneer Tikka', orders: 25, revenue: 6250 }
    ]
  });
});

analyticsRoutes.get('/hourly', (req, res) => {
  res.json({
    hours: [
      { hour: '11:00', orders: 8, revenue: 2800 },
      { hour: '12:00', orders: 15, revenue: 5400 },
      { hour: '13:00', orders: 18, revenue: 6500 },
      { hour: '19:00', orders: 22, revenue: 7800 },
      { hour: '20:00', orders: 25, revenue: 9000 },
      { hour: '21:00', orders: 20, revenue: 7200 }
    ]
  });
});

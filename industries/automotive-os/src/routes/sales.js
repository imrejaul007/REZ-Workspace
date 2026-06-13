/**
 * Automotive OS - Sales Routes
 */

const express = require('express');
const router = express.Router();

let sales = [
  { id: 'SAL-001', vehicleId: 'VEH-001', customerId: 'CUST-001', price: 2800000, date: '2024-01-10', paymentMethod: 'financing', status: 'completed' },
  { id: 'SAL-002', vehicleId: 'VEH-002', customerId: 'CUST-002', price: 1800000, date: '2023-06-15', paymentMethod: 'cash', status: 'completed' }
];

router.get('/', (req, res) => {
  const { customerId, status } = req.query;
  let filtered = [...sales];
  if (customerId) filtered = filtered.filter(s => s.customerId === customerId);
  if (status) filtered = filtered.filter(s => s.status === status);
  res.json({ sales: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { vehicleId, customerId, price, paymentMethod } = req.body;
  if (!vehicleId || !customerId) return res.status(400).json({ error: 'vehicleId and customerId required' });
  const newSale = { id: `SAL-${Date.now()}`, vehicleId, customerId, price: price || 0, date: new Date().toISOString(), paymentMethod: paymentMethod || 'cash', status: 'completed' };
  sales.push(newSale);
  res.status(201).json(newSale);
});

module.exports = router;
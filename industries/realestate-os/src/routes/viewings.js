/**
 * Real Estate OS - Viewings Routes
 */

const express = require('express');
const router = express.Router();

let viewings = [
  { id: 'VIEW-001', propertyId: 'PROP-001', buyerId: 'BUY-001', date: '2024-01-20', time: '10:00', status: 'scheduled', notes: '' },
  { id: 'VIEW-002', propertyId: 'PROP-002', buyerId: 'BUY-002', date: '2024-01-21', time: '14:00', status: 'scheduled', notes: '' }
];

router.get('/', (req, res) => {
  const { propertyId, buyerId, status } = req.query;
  let filtered = [...viewings];
  if (propertyId) filtered = filtered.filter(v => v.propertyId === propertyId);
  if (buyerId) filtered = filtered.filter(v => v.buyerId === buyerId);
  if (status) filtered = filtered.filter(v => v.status === status);
  res.json({ viewings: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { propertyId, buyerId, date, time } = req.body;
  if (!propertyId || !buyerId || !date) return res.status(400).json({ error: 'propertyId, buyerId, date required' });
  const newViewing = { id: `VIEW-${Date.now()}`, propertyId, buyerId, date, time: time || '10:00', status: 'scheduled', notes: '' };
  viewings.push(newViewing);
  res.status(201).json(newViewing);
});

module.exports = router;
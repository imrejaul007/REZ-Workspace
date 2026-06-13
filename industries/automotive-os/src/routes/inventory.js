/**
 * Automotive OS - Inventory Routes
 */

const express = require('express');
const router = express.Router();

let inventory = [
  { id: 'INV-001', partNumber: 'OIL-5W30', name: 'Engine Oil 5W30', category: 'fluids', quantity: 50, minStock: 20, price: 500 },
  { id: 'INV-002', partNumber: 'FLT-AIR-001', name: 'Air Filter', category: 'filters', quantity: 30, minStock: 15, price: 350 },
  { id: 'INV-003', partNumber: 'BRK-PAD-001', name: 'Brake Pads', category: 'brakes', quantity: 10, minStock: 20, price: 2500 }
];

router.get('/', (req, res) => {
  const { category, lowStock } = req.query;
  let filtered = [...inventory];
  if (category) filtered = filtered.filter(i => i.category === category);
  if (lowStock === 'true') filtered = filtered.filter(i => i.quantity < i.minStock);
  res.json({ inventory: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const item = inventory.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

router.post('/', (req, res) => {
  const { partNumber, name, category, quantity, minStock, price } = req.body;
  if (!partNumber || !name) return res.status(400).json({ error: 'partNumber and name required' });
  const newItem = { id: `INV-${Date.now()}`, partNumber, name, category: category || 'general', quantity: quantity || 0, minStock: minStock || 10, price: price || 0 };
  inventory.push(newItem);
  res.status(201).json(newItem);
});

router.patch('/:id/adjust', (req, res) => {
  const item = inventory.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  item.quantity += req.body.adjustment || 0;
  res.json(item);
});

module.exports = router;
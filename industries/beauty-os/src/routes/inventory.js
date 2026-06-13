/**
 * Beauty OS - Inventory Routes
 */

const express = require('express');
const router = express.Router();

let inventory = [
  { id: 'INV-001', name: 'Hair Dye - Brown', category: 'color', quantity: 50, unit: 'bottles', minStock: 20, price: 500 },
  { id: 'INV-002', name: 'Massage Oil', category: 'spa', quantity: 30, unit: 'liters', minStock: 15, price: 800 }
];

router.get('/', (req, res) => {
  const { category, lowStock } = req.query;
  let filtered = [...inventory];
  if (category) filtered = filtered.filter(i => i.category === category);
  if (lowStock === 'true') filtered = filtered.filter(i => i.quantity < i.minStock);
  res.json({ inventory: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { name, category, quantity, unit, minStock, price } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const newItem = { id: `INV-${Date.now()}`, name, category: category || 'general', quantity: quantity || 0, unit: unit || 'units', minStock: minStock || 10, price: price || 0 };
  inventory.push(newItem);
  res.status(201).json(newItem);
});

module.exports = router;
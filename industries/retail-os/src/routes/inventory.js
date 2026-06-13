/**
 * Retail OS - Inventory Routes
 */

const express = require('express');
const router = express.Router();

let inventory = [
  { id: 'INV-001', productId: 'PROD-001', warehouse: 'WH-North', quantity: 100, minStock: 20 },
  { id: 'INV-002', productId: 'PROD-002', warehouse: 'WH-North', quantity: 50, minStock: 10 },
  { id: 'INV-003', productId: 'PROD-003', warehouse: 'WH-South', quantity: 15, minStock: 25 }
];

// GET /api/inventory
router.get('/', (req, res) => {
  const { warehouse, lowStock } = req.query;
  let filtered = [...inventory];
  if (warehouse) filtered = filtered.filter(i => i.warehouse === warehouse);
  if (lowStock === 'true') filtered = filtered.filter(i => i.quantity < i.minStock);
  res.json({ inventory: filtered, count: filtered.length });
});

// GET /api/inventory/:id
router.get('/:id', (req, res) => {
  const item = inventory.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Inventory item not found' });
  res.json(item);
});

// POST /api/inventory
router.post('/', (req, res) => {
  const { productId, warehouse, quantity, minStock } = req.body;
  if (!productId || !warehouse) return res.status(400).json({ error: 'productId and warehouse required' });

  const newItem = { id: `INV-${Date.now()}`, productId, warehouse, quantity: quantity || 0, minStock: minStock || 10 };
  inventory.push(newItem);
  res.status(201).json(newItem);
});

// PATCH /api/inventory/:id/adjust
router.patch('/:id/adjust', (req, res) => {
  const item = inventory.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Inventory item not found' });
  item.quantity += req.body.adjustment || 0;
  res.json(item);
});

module.exports = router;
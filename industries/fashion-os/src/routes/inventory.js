/**
 * Fashion OS - Inventory Routes
 */

const express = require('express');
const router = express.Router();

let inventory = [
  { id: 'INV-001', productId: 'PRD-001', size: 'S', color: 'Red', quantity: 10, location: 'WH-1' },
  { id: 'INV-002', productId: 'PRD-001', size: 'M', color: 'Red', quantity: 8, location: 'WH-1' },
  { id: 'INV-003', productId: 'PRD-001', size: 'L', color: 'Blue', quantity: 7, location: 'WH-2' }
];

router.get('/', (req, res) => {
  const { productId, lowStock } = req.query;
  let filtered = [...inventory];
  if (productId) filtered = filtered.filter(i => i.productId === productId);
  if (lowStock === 'true') filtered = filtered.filter(i => i.quantity < 5);
  res.json({ inventory: filtered, count: filtered.length });
});

module.exports = router;
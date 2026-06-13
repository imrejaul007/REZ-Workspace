/**
 * Fashion OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'fashion-product-twin', name: 'Product Twin', type: 'product', health: 98 },
      { id: 'fashion-collection-twin', name: 'Collection Twin', type: 'collection', health: 97 },
      { id: 'fashion-inventory-twin', name: 'Inventory Twin', type: 'inventory', health: 96 },
      { id: 'fashion-trend-twin', name: 'Trend Twin', type: 'trend', health: 95 }
    ],
    total: 4
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'fashion-product-twin': { name: 'Product Twin', type: 'product', state: { total: 150, active: 120 } },
    'fashion-collection-twin': { name: 'Collection Twin', type: 'collection', state: { total: 12, active: 3 } },
    'fashion-inventory-twin': { name: 'Inventory Twin', type: 'inventory', state: { total: 500, lowStock: 45 } },
    'fashion-trend-twin': { name: 'Trend Twin', type: 'trend', state: { total: 25, trending: 8 } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;
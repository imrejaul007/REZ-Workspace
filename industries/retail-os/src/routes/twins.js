/**
 * Retail OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

// GET /api/twins
router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'retail-customer-twin', name: 'Customer Twin', type: 'customer', health: 98 },
      { id: 'retail-product-twin', name: 'Product Twin', type: 'product', health: 100 },
      { id: 'retail-inventory-twin', name: 'Inventory Twin', type: 'inventory', health: 95 },
      { id: 'retail-order-twin', name: 'Order Twin', type: 'order', health: 97 },
      { id: 'retail-revenue-twin', name: 'Revenue Twin', type: 'revenue', health: 98 }
    ],
    total: 5
  });
});

// GET /api/twins/:id
router.get('/:id', (req, res) => {
  const twinMap = {
    'retail-customer-twin': { name: 'Customer Twin', type: 'customer', state: { total: 1250, active: 890 } },
    'retail-product-twin': { name: 'Product Twin', type: 'product', state: { total: 234, active: 198 } },
    'retail-inventory-twin': { name: 'Inventory Twin', type: 'inventory', state: { total: 5000, lowStock: 45 } },
    'retail-order-twin': { name: 'Order Twin', type: 'order', state: { pending: 23, processing: 12 } },
    'retail-revenue-twin': { name: 'Revenue Twin', type: 'revenue', state: { today: 125000, month: 3500000 } }
  };

  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

// POST /api/twins/:id/sync
router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;
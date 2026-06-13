/**
 * Inventory Routes
 */

import { Router } from 'express';

export const inventoryRoutes = Router();

const inventory = new Map([
  ['INV-001', { id: 'INV-001', name: 'Chicken', quantity: 15, unit: 'kg', reorderPoint: 50, supplier: 'Fresh Foods', cost: 180 }],
  ['INV-002', { id: 'INV-002', name: 'Basmati Rice', quantity: 20, unit: 'kg', reorderPoint: 40, supplier: 'Premium Foods', cost: 120 }],
  ['INV-003', { id: 'INV-003', name: 'Cooking Oil', quantity: 5, unit: 'L', reorderPoint: 20, supplier: 'Pure Oils', cost: 200 }]
]);

inventoryRoutes.get('/', (req, res) => {
  res.json({ items: Array.from(inventory.values()), total: inventory.size });
});

inventoryRoutes.get('/low-stock', (req, res) => {
  const low = Array.from(inventory.values()).filter(i => i.quantity < i.reorderPoint);
  res.json({ items: low, total: low.length });
});

inventoryRoutes.patch('/:id/quantity', (req, res) => {
  const item = inventory.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  item.quantity = req.body.quantity;
  res.json(item);
});

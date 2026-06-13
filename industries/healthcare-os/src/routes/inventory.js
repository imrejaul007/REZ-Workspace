/**
 * Medical Inventory Routes
 */

import { Router } from 'express';

export const inventoryRoutes = Router();

const inventory = new Map([
  ['INV-001', { id: 'INV-001', name: 'Paracetamol 500mg', category: 'medicine', quantity: 500, unit: 'tablets', reorderPoint: 200 }],
  ['INV-002', { id: 'INV-002', name: 'O-negative Blood', category: 'blood', quantity: 2, unit: 'units', reorderPoint: 5 }]
]);

inventoryRoutes.get('/', (req, res) => {
  res.json({ items: Array.from(inventory.values()), total: inventory.size });
});

inventoryRoutes.get('/low-stock', (req, res) => {
  const low = Array.from(inventory.values()).filter(i => i.quantity < i.reorderPoint);
  res.json({ items: low, total: low.length });
});

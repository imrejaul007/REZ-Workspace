const express = require('express');
const router = express.Router();

let inventory = [
  { id: '1', name: 'Steel Sheets', quantity: 500, unit: 'sheets', minLevel: 100, unitPrice: 25 },
  { id: '2', name: 'Copper Wire', quantity: 1000, unit: 'meters', minLevel: 200, unitPrice: 5 },
  { id: '3', name: 'Bearings', quantity: 200, unit: 'units', minLevel: 50, unitPrice: 15 },
  { id: '4', name: 'Hydraulic Fluid', quantity: 50, unit: 'barrels', minLevel: 10, unitPrice: 200 }
];

// GET all inventory
router.get('/', (req, res) => {
  res.json(inventory);
});

// GET single inventory item
router.get('/:id', (req, res) => {
  const item = inventory.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Inventory item not found' });
  res.json(item);
});

// POST new inventory item
router.post('/', (req, res) => {
  const newItem = {
    id: String(inventory.length + 1),
    name: req.body.name,
    quantity: req.body.quantity,
    unit: req.body.unit,
    minLevel: req.body.minLevel || 0,
    unitPrice: req.body.unitPrice || 0
  };
  inventory.push(newItem);
  res.status(201).json(newItem);
});

// PUT update inventory
router.put('/:id', (req, res) => {
  const index = inventory.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Inventory item not found' });
  inventory[index] = { ...inventory[index], ...req.body };
  res.json(inventory[index]);
});

// DELETE inventory item
router.delete('/:id', (req, res) => {
  const index = inventory.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Inventory item not found' });
  inventory.splice(index, 1);
  res.json({ message: 'Inventory item deleted successfully' });
});

module.exports = router;
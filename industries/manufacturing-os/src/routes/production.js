const express = require('express');
const router = express.Router();

let production = [
  { id: '1', productId: '1', machineId: '1', quantity: 50, startTime: '2024-06-10T08:00:00', endTime: '2024-06-10T16:00:00' },
  { id: '2', productId: '2', machineId: '2', quantity: 200, startTime: '2024-06-11T08:00:00', endTime: '2024-06-11T14:00:00' },
  { id: '3', productId: '3', machineId: '5', quantity: 25, startTime: '2024-06-12T08:00:00', endTime: '2024-06-12T12:00:00' }
];

// GET all production records
router.get('/', (req, res) => {
  res.json(production);
});

// GET single production record
router.get('/:id', (req, res) => {
  const record = production.find(p => p.id === req.params.id);
  if (!record) return res.status(404).json({ error: 'Production record not found' });
  res.json(record);
});

// POST new production record
router.post('/', (req, res) => {
  const newRecord = {
    id: String(production.length + 1),
    productId: req.body.productId,
    machineId: req.body.machineId,
    quantity: req.body.quantity,
    startTime: req.body.startTime,
    endTime: req.body.endTime
  };
  production.push(newRecord);
  res.status(201).json(newRecord);
});

// PUT update production record
router.put('/:id', (req, res) => {
  const index = production.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Production record not found' });
  production[index] = { ...production[index], ...req.body };
  res.json(production[index]);
});

// DELETE production record
router.delete('/:id', (req, res) => {
  const index = production.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Production record not found' });
  production.splice(index, 1);
  res.json({ message: 'Production record deleted successfully' });
});

module.exports = router;
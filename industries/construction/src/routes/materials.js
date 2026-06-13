const express = require('express');
const router = express.Router();

let materials = [
  { id: '1', name: 'Cement', quantity: 500, unitPrice: 80, supplier: 'Cement Corp' },
  { id: '2', name: 'Steel Bars', quantity: 200, unitPrice: 150, supplier: 'Steel Industries' },
  { id: '3', name: 'Bricks', quantity: 10000, unitPrice: 2, supplier: 'Brick Factory' },
  { id: '4', name: 'Concrete Mix', quantity: 300, unitPrice: 120, supplier: 'Concrete Solutions' }
];

// GET all materials
router.get('/', (req, res) => {
  res.json(materials);
});

// GET single material
router.get('/:id', (req, res) => {
  const material = materials.find(m => m.id === req.params.id);
  if (!material) return res.status(404).json({ error: 'Material not found' });
  res.json(material);
});

// POST new material
router.post('/', (req, res) => {
  const newMaterial = {
    id: String(materials.length + 1),
    name: req.body.name,
    quantity: req.body.quantity || 0,
    unitPrice: req.body.unitPrice || 0,
    supplier: req.body.supplier
  };
  materials.push(newMaterial);
  res.status(201).json(newMaterial);
});

// PUT update material
router.put('/:id', (req, res) => {
  const index = materials.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Material not found' });
  materials[index] = { ...materials[index], ...req.body };
  res.json(materials[index]);
});

// DELETE material
router.delete('/:id', (req, res) => {
  const index = materials.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Material not found' });
  materials.splice(index, 1);
  res.json({ message: 'Material deleted successfully' });
});

module.exports = router;
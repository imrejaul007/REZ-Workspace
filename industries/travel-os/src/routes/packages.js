const express = require('express');
const router = express.Router();

let packages = [
  { id: '1', destinationId: '1', duration: 5, inclusions: ['hotel', 'flights', 'tours'], price: 2500 },
  { id: '2', destinationId: '2', duration: 7, inclusions: ['villa', 'flights', 'meals', 'spa'], price: 3200 },
  { id: '3', destinationId: '3', duration: 8, inclusions: ['hotel', 'flights', 'rail pass'], price: 4500 },
  { id: '4', destinationId: '4', duration: 5, inclusions: ['overwater villa', 'flights', 'diving', 'meals'], price: 6500 }
];

// GET all packages
router.get('/', (req, res) => {
  res.json(packages);
});

// GET single package
router.get('/:id', (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });
  res.json(pkg);
});

// POST new package
router.post('/', (req, res) => {
  const newPackage = {
    id: String(packages.length + 1),
    destinationId: req.body.destinationId,
    duration: req.body.duration,
    inclusions: req.body.inclusions || [],
    price: req.body.price
  };
  packages.push(newPackage);
  res.status(201).json(newPackage);
});

// PUT update package
router.put('/:id', (req, res) => {
  const index = packages.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Package not found' });
  packages[index] = { ...packages[index], ...req.body };
  res.json(packages[index]);
});

// DELETE package
router.delete('/:id', (req, res) => {
  const index = packages.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Package not found' });
  packages.splice(index, 1);
  res.json({ message: 'Package deleted successfully' });
});

module.exports = router;
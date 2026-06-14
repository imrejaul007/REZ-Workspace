const express = require('express');
const router = express.Router();

let products = [
  { id: '1', name: 'Industrial Motor', category: 'components', specs: { power: '5HP', voltage: '440V' }, cost: 500, price: 750 },
  { id: '2', name: 'Steel Gear', category: 'parts', specs: { diameter: '200mm', material: 'steel' }, cost: 50, price: 85 },
  { id: '3', name: 'Control Panel', category: 'electronics', specs: { channels: 16, display: 'LCD' }, cost: 200, price: 350 },
  { id: '4', name: 'Hydraulic Pump', category: 'components', specs: { flow: '50L/min', pressure: '3000PSI' }, cost: 800, price: 1200 }
];

// GET all products
router.get('/', (req, res) => {
  res.json(products);
});

// GET single product
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST new product
router.post('/', (req, res) => {
  const newProduct = {
    id: String(products.length + 1),
    name: req.body.name,
    category: req.body.category,
    specs: req.body.specs || {},
    cost: req.body.cost || 0,
    price: req.body.price || 0
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT update product
router.put('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

// DELETE product
router.delete('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(index, 1);
  res.json({ message: 'Product deleted successfully' });
});

module.exports = router;
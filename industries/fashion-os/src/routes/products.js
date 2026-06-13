/**
 * Fashion OS - Products Routes
 */

const express = require('express');
const router = express.Router();

let products = [
  { id: 'PRD-001', name: 'Summer Dress', category: 'dresses', price: 4500, sizes: ['S', 'M', 'L'], colors: ['Red', 'Blue'], stock: 25, sku: 'SD-001' },
  { id: 'PRD-002', name: 'Designer Jacket', category: 'outerwear', price: 8500, sizes: ['M', 'L', 'XL'], colors: ['Black', 'Navy'], stock: 15, sku: 'DJ-001' }
];

router.get('/', (req, res) => {
  const { category } = req.query;
  let filtered = [...products];
  if (category) filtered = filtered.filter(p => p.category === category);
  res.json({ products: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

router.post('/', (req, res) => {
  const { name, category, price, sizes, colors, sku } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'name and price required' });
  const newProduct = { id: `PRD-${Date.now()}`, name, category: category || 'general', price, sizes: sizes || [], colors: colors || [], stock: 0, sku: sku || `SKU-${products.length + 1}` };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

module.exports = router;
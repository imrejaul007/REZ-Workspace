/**
 * Beauty OS - Products Routes
 */

const express = require('express');
const router = express.Router();

let products = [
  { id: 'PRD-001', name: 'Premium Shampoo', category: 'haircare', price: 450, stock: 50, sku: 'SHAMP-001' },
  { id: 'PRD-002', name: 'Face Serum', category: 'skincare', price: 1200, stock: 30, sku: 'SERUM-001' }
];

router.get('/', (req, res) => {
  const { category } = req.query;
  let filtered = [...products];
  if (category) filtered = filtered.filter(p => p.category === category);
  res.json({ products: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { name, category, price, sku } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'name and price required' });
  const newProduct = { id: `PRD-${Date.now()}`, name, category: category || 'general', price, stock: 0, sku: sku || `SKU-${products.length + 1}` };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

module.exports = router;
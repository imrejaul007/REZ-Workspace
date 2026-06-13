/**
 * Retail OS - Products Routes
 */

const express = require('express');
const router = express.Router();

let products = [
  { id: 'PROD-001', name: 'Smartphone X', price: 25000, stock: 45, category: 'Electronics', sku: 'ELEC-001' },
  { id: 'PROD-002', name: 'Laptop Pro', price: 65000, stock: 12, category: 'Electronics', sku: 'ELEC-002' },
  { id: 'PROD-003', name: 'Running Shoes', price: 3500, stock: 28, category: 'Footwear', sku: 'FOOT-001' },
  { id: 'PROD-004', name: 'Coffee Maker', price: 8500, stock: 15, category: 'Home Appliances', sku: 'HOME-001' }
];

// GET /api/products
router.get('/', (req, res) => {
  const { category, inStock } = req.query;
  let filtered = [...products];
  if (category) filtered = filtered.filter(p => p.category === category);
  if (inStock === 'true') filtered = filtered.filter(p => p.stock > 0);
  res.json({ products: filtered, count: filtered.length });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /api/products
router.post('/', (req, res) => {
  const { name, price, stock, category, sku } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'name and price required' });

  const newProduct = { id: `PROD-${Date.now()}`, name, price, stock: stock || 0, category: category || 'General', sku: sku || `SKU-${products.length + 1}` };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(index, 1);
  res.json({ message: 'Product deleted' });
});

// PATCH /api/products/:id/stock
router.patch('/:id/stock', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  product.stock = req.body.stock;
  res.json(product);
});

module.exports = router;
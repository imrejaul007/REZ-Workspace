/**
 * Real Estate OS - Sellers Routes
 */

const express = require('express');
const router = express.Router();

let sellers = [
  { id: 'SEL-001', name: 'Robert Johnson', email: 'robert@email.com', phone: '9876543212', propertyId: 'PROP-001', askingPrice: 5000000, status: 'active' }
];

router.get('/', (req, res) => res.json({ sellers, count: sellers.length }));

router.get('/:id', (req, res) => {
  const seller = sellers.find(s => s.id === req.params.id);
  if (!seller) return res.status(404).json({ error: 'Seller not found' });
  res.json(seller);
});

router.post('/', (req, res) => {
  const { name, email, phone, propertyId, askingPrice } = req.body;
  if (!name || !propertyId) return res.status(400).json({ error: 'name and propertyId required' });
  const newSeller = { id: `SEL-${Date.now()}`, name, email: email || null, phone: phone || null, propertyId, askingPrice: askingPrice || 0, status: 'active' };
  sellers.push(newSeller);
  res.status(201).json(newSeller);
});

module.exports = router;
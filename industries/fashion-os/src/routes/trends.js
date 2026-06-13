/**
 * Fashion OS - Trends Routes
 */

const express = require('express');
const router = express.Router();

let trends = [
  { id: 'TRD-001', name: 'Minimalist Fashion', category: 'style', popularity: 85, season: '2024' },
  { id: 'TRD-002', name: 'Sustainable Fabrics', category: 'material', popularity: 90, season: '2024' }
];

router.get('/', (req, res) => {
  const { category } = req.query;
  let filtered = [...trends];
  if (category) filtered = filtered.filter(t => t.category === category);
  res.json({ trends: filtered, count: filtered.length });
});

module.exports = router;
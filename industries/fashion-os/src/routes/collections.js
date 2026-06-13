/**
 * Fashion OS - Collections Routes
 */

const express = require('express');
const router = express.Router();

let collections = [
  { id: 'COL-001', name: 'Summer 2024', season: 'Summer', year: 2024, status: 'active', products: ['PRD-001'] },
  { id: 'COL-002', name: 'Winter 2024', season: 'Winter', year: 2024, status: 'planned', products: ['PRD-002'] }
];

router.get('/', (req, res) => {
  const { season, status } = req.query;
  let filtered = [...collections];
  if (season) filtered = filtered.filter(c => c.season === season);
  if (status) filtered = filtered.filter(c => c.status === status);
  res.json({ collections: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { name, season, year } = req.body;
  if (!name || !season) return res.status(400).json({ error: 'name and season required' });
  const newCollection = { id: `COL-${Date.now()}`, name, season, year: year || 2024, status: 'planned', products: [] };
  collections.push(newCollection);
  res.status(201).json(newCollection);
});

module.exports = router;
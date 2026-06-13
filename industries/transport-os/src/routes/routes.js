/**
 * Transport OS - Routes Routes
 */

const express = require('express');
const router = express.Router();

let routes = [
  { id: 'RTE-001', name: 'Downtown Express', startPoint: 'Central Station', endPoint: 'Business District', distance: 8.5, estimatedTime: 25, status: 'active' }
];

router.get('/', (req, res) => res.json({ routes, count: routes.length }));

router.post('/', (req, res) => {
  const { name, startPoint, endPoint, distance } = req.body;
  if (!name || !startPoint || !endPoint) return res.status(400).json({ error: 'name, startPoint, endPoint required' });
  const newRoute = { id: `RTE-${Date.now()}`, name, startPoint, endPoint, distance: distance || 0, estimatedTime: distance ? Math.round(distance * 3) : 15, status: 'active' };
  routes.push(newRoute);
  res.status(201).json(newRoute);
});

module.exports = router;
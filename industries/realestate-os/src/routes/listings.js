/**
 * Real Estate OS - Listings Routes
 */

const express = require('express');
const router = express.Router();

let listings = [
  { id: 'LST-001', propertyId: 'PROP-001', agentId: 'AGT-001', listedDate: '2024-01-01', status: 'active', views: 150 },
  { id: 'LST-002', propertyId: 'PROP-002', agentId: 'AGT-002', listedDate: '2024-01-05', status: 'active', views: 89 }
];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = [...listings];
  if (status) filtered = filtered.filter(l => l.status === status);
  res.json({ listings: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { propertyId, agentId } = req.body;
  if (!propertyId || !agentId) return res.status(400).json({ error: 'propertyId and agentId required' });
  const newListing = { id: `LST-${Date.now()}`, propertyId, agentId, listedDate: new Date().toISOString(), status: 'active', views: 0 };
  listings.push(newListing);
  res.status(201).json(newListing);
});

module.exports = router;
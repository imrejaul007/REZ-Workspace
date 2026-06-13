/**
 * Transport OS - Trips Routes
 */

const express = require('express');
const router = express.Router();

let trips = [
  { id: 'TRP-001', riderId: 'RID-001', driverId: 'DRV-001', pickup: 'Location A', dropoff: 'Location B', distance: 5.5, fare: 150, status: 'completed', date: '2024-01-15' }
];

router.get('/', (req, res) => {
  const { riderId, driverId, status } = req.query;
  let filtered = [...trips];
  if (riderId) filtered = filtered.filter(t => t.riderId === riderId);
  if (driverId) filtered = filtered.filter(t => t.driverId === driverId);
  if (status) filtered = filtered.filter(t => t.status === status);
  res.json({ trips: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { riderId, driverId, pickup, dropoff, distance } = req.body;
  if (!riderId || !driverId || !pickup || !dropoff) return res.status(400).json({ error: 'riderId, driverId, pickup, dropoff required' });
  const fare = distance ? distance * 30 : 100;
  const newTrip = { id: `TRP-${Date.now()}`, riderId, driverId, pickup, dropoff, distance: distance || 0, fare, status: 'pending', date: new Date().toISOString() };
  trips.push(newTrip);
  res.status(201).json(newTrip);
});

module.exports = router;
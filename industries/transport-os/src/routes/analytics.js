/**
 * Transport OS - Analytics Routes
 */

const express = require('express');
const router = express.Router();

router.get('/overview', (req, res) => {
  res.json({ totalTrips: 500, totalRevenue: 75000, avgFare: 150, activeDrivers: 45, period: 'day' });
});

router.get('/drivers', (req, res) => {
  res.json({ topDrivers: [{ id: 'DRV-001', trips: 150, rating: 4.8 }, { id: 'DRV-002', trips: 200, rating: 4.9 }] });
});

module.exports = router;
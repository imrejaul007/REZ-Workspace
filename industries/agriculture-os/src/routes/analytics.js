/**
 * Agriculture OS - Analytics Routes
 */

const express = require('express');
const router = express.Router();

router.get('/overview', (req, res) => {
  res.json({ totalFarms: 2, totalCrops: 3, totalLivestock: 550, waterUsage: 50000, period: 'month' });
});

router.get('/yield', (req, res) => {
  res.json({ predictedYield: { wheat: 500, corn: 450, apples: 200 }, actualYield: { wheat: 0, corn: 0, apples: 0 } });
});

module.exports = router;

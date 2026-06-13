/**
 * Hospitality OS - Analytics Routes
 */

const express = require('express');
const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  res.json({
    todayRevenue: 85000,
    weekRevenue: 425000,
    monthRevenue: 1800000,
    revpar: 4250,
    adr: 5200,
    occupancyRate: 75.5,
    period: 'today'
  });
});

// GET /api/analytics/rooms
router.get('/rooms', (req, res) => {
  res.json({
    totalRooms: 50,
    occupied: 38,
    available: 12,
    occupancyRate: 76,
    avgStayLength: 2.5
  });
});

// GET /api/analytics/guests
router.get('/guests', (req, res) => {
  res.json({
    totalGuests: 1250,
    repeatGuests: 450,
    avgLifetimeValue: 45000,
    satisfactionScore: 4.5
  });
});

module.exports = router;
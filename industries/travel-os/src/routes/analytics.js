const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalBookings: 5000,
    totalRevenue: 15000000,
    averageBookingValue: 3000,
    popularDestinations: ['Maldives', 'Bali', 'Paris', 'Tokyo'],
    peakSeason: 'July-August',
    repeatCustomers: 0.45
  });
});

// GET destination analytics
router.get('/destinations', (req, res) => {
  res.json({
    totalDestinations: 25,
    bookingsByDestination: {
      maldives: 1200,
      bali: 1000,
      paris: 800,
      tokyo: 750
    },
    averageRating: 4.6,
    trendingDestinations: ['Maldives', 'Swiss Alps', 'Japan']
  });
});

// GET booking analytics
router.get('/bookings', (req, res) => {
  res.json({
    totalBookings: 5000,
    confirmedBookings: 4200,
    pendingBookings: 800,
    cancellationRate: 0.08,
    averageLeadTime: '45 days',
    seasonalTrend: { q1: 0.2, q2: 0.35, q3: 0.30, q4: 0.15 }
  });
});

module.exports = router;
const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalBookings: 15000,
    activeProviders: 250,
    totalCustomers: 8000,
    averageRating: 4.6,
    revenue: {
      monthly: 450000,
      yearly: 5400000
    },
    popularServices: ['Plumbing', 'Electrical', 'House Cleaning'],
    averageBookingValue: 75
  });
});

// GET provider analytics
router.get('/providers', (req, res) => {
  res.json({
    totalProviders: 250,
    topRatedProviders: ['Ramesh Plumber', 'Clean Pro Services'],
    averageRating: 4.6,
    bookingsByProvider: { avg: 60, max: 150 },
    utilizationRate: 0.72
  });
});

// GET service analytics
router.get('/services', (req, res) => {
  res.json({
    totalServices: 15,
    popularServices: ['Plumbing', 'Electrical', 'House Cleaning', 'AC Repair'],
    bookingsByService: {
      plumbing: 4500,
      electrical: 3800,
      cleaning: 4200,
      ac_repair: 2500
    },
    averagePriceByService: {
      plumbing: 75,
      electrical: 85,
      cleaning: 55,
      ac_repair: 120
    }
  });
});

module.exports = router;
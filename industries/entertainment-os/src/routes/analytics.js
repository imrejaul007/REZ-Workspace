const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalEvents: 50,
    totalVenues: 15,
    totalArtists: 80,
    totalTicketsSold: 500000,
    totalRevenue: 25000000,
    averageOccupancy: 0.85
  });
});

// GET event analytics
router.get('/events', (req, res) => {
  res.json({
    totalEvents: 50,
    upcomingEvents: 20,
    completedEvents: 30,
    averageAttendance: 8500,
    selloutRate: 0.35,
    popularGenres: ['pop', 'rock', 'comedy']
  });
});

// GET ticket analytics
router.get('/tickets', (req, res) => {
  res.json({
    totalTickets: 500000,
    vipTickets: 50000,
    standardTickets: 450000,
    averageTicketPrice: 75,
    revenueByGenre: {
      pop: 8000000,
      rock: 6000000,
      comedy: 4000000,
      jazz: 2000000
    }
  });
});

module.exports = router;
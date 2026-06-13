const express = require('express');
const router = express.Router();

// Digital Twins for Travel OS

// GET all twins
router.get('/', (req, res) => {
  res.json({
    twins: ['DestinationTwin', 'PackageTwin', 'BookingTwin', 'TravelerTwin']
  });
});

// DestinationTwin - destination simulation
router.get('/destination', (req, res) => {
  res.json({
    twinType: 'DestinationTwin',
    description: 'Travel destination simulation',
    state: {
      destinationId: 'D001',
      name: 'Maldives',
      country: 'Maldives',
      type: 'island',
      rating: 4.9,
      demandScore: 0.92,
      weather: { current: 'sunny', temperature: 28 },
      availability: { hotels: 0.85, flights: 0.70 }
    },
    operations: ['predictDemand', 'priceOptimization', 'weatherImpact']
  });
});

// PackageTwin - travel package simulation
router.get('/package', (req, res) => {
  res.json({
    twinType: 'PackageTwin',
    description: 'Travel package simulation',
    state: {
      packageId: 'P001',
      destination: 'Maldives',
      duration: 5,
      price: 6500,
      popularity: 0.88,
      competitorPrices: { avg: 6200, min: 5500, max: 8000 }
    },
    operations: ['priceOptimization', 'demandPrediction', 'bundleAnalysis']
  });
});

// BookingTwin - booking simulation
router.get('/booking', (req, res) => {
  res.json({
    twinType: 'BookingTwin',
    description: 'Booking lifecycle simulation',
    state: {
      bookingId: 'B001',
      status: 'confirmed',
      destination: 'Paris',
      travelers: 2,
      totalPrice: 5000,
      paymentStatus: 'paid',
      cancellationRisk: 0.05
    },
    operations: ['predictCancellation', 'upgradeOpportunity', 'upsellPotential']
  });
});

// TravelerTwin - traveler simulation
router.get('/traveler', (req, res) => {
  res.json({
    twinType: 'TravelerTwin',
    description: 'Traveler preferences and behavior simulation',
    state: {
      travelerId: 'T001',
      name: 'John Smith',
      preferences: { seat: 'window', meal: 'vegetarian' },
      travelHistory: ['Maldives', 'Bali', 'Paris'],
      loyaltyTier: 'gold',
      lifetimeValue: 15000
    },
    operations: ['personalizeRecommendations', 'predictPreferences', 'loyaltyOptimization']
  });
});

module.exports = router;
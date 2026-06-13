const express = require('express');
const router = express.Router();

// Digital Twins for Home Services OS

// GET all twins
router.get('/', (req, res) => {
  res.json({
    twins: ['ProviderTwin', 'CustomerTwin', 'BookingTwin', 'ServiceTwin']
  });
});

// ProviderTwin - service provider simulation
router.get('/provider', (req, res) => {
  res.json({
    twinType: 'ProviderTwin',
    description: 'Service provider simulation and optimization',
    state: {
      providerId: 'P001',
      name: 'Ramesh Plumber',
      skills: ['plumbing', 'pipe fitting'],
      rating: 4.8,
      bookingsThisMonth: 45,
      utilizationRate: 0.78,
      earnings: { daily: 850, monthly: 25500 }
    },
    operations: ['optimizeSchedule', 'predictDemand', 'routeOptimization']
  });
});

// CustomerTwin - customer simulation
router.get('/customer', (req, res) => {
  res.json({
    twinType: 'CustomerTwin',
    description: 'Customer behavior and preferences simulation',
    state: {
      customerId: 'C001',
      name: 'Amit Sharma',
      totalBookings: 12,
      preferredServices: ['plumbing', 'electrical'],
      averageSpend: 75,
      satisfactionScore: 0.92,
      location: 'Delhi NCR'
    },
    operations: ['predictNeeds', 'personalizeRecommendations', 'churnPrediction']
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
      serviceType: 'plumbing',
      providerMatchScore: 0.95,
      estimatedDuration: 2,
      price: 75
    },
    operations: ['predictCompletion', 'optimizeScheduling', 'trackSatisfaction']
  });
});

// ServiceTwin - service simulation
router.get('/service', (req, res) => {
  res.json({
    twinType: 'ServiceTwin',
    description: 'Service demand and pricing simulation',
    state: {
      serviceId: 'S001',
      name: 'Plumbing',
      demandScore: 0.85,
      averagePrice: 75,
      peakHours: ['9AM-12PM', '2PM-5PM'],
      providerCount: 45
    },
    operations: ['dynamicPricing', 'demandPrediction', 'providerAllocation']
  });
});

module.exports = router;
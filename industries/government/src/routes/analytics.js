const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalCitizens: 50000000,
    servicesProcessed: {
      monthly: 2500000,
      yearly: 30000000
    },
    averageProcessingTime: '15 days',
    satisfactionRate: 0.78,
    departments: 25,
    activePermits: 1500000
  });
});

// GET service analytics
router.get('/services', (req, res) => {
  res.json({
    totalServices: 150,
    popularServices: ['Passport', 'Driving License', 'Tax Filing', 'Aadhar'],
    averageWaitTime: '30 minutes',
    onlineAdoptionRate: 0.65,
    processingTimeByService: {
      passport: 30,
      drivingLicense: 14,
      birthCertificate: 7
    }
  });
});

// GET complaint analytics
router.get('/complaints', (req, res) => {
  res.json({
    totalComplaints: 50000,
    openComplaints: 8500,
    resolutionRate: 0.83,
    averageResolutionTime: '12 days',
    complaintsByType: {
      service_delay: 0.35,
      corruption: 0.15,
      facility: 0.30,
      other: 0.20
    }
  });
});

module.exports = router;